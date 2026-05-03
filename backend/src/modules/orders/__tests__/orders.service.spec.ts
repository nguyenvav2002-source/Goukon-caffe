import { Decimal } from '@prisma/client/runtime/library';
import { OrdersService } from '../orders.service';

const makePrisma = () => ({
  eventSession: { findUnique: jest.fn() },
  eventRegistration: { findFirst: jest.fn() },
  order: { findMany: jest.fn(), create: jest.fn() },
  menuItem: { findMany: jest.fn() },
});

describe('OrdersService – pricing logic', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrdersService(prisma as any);
  });

  it('should give first drink free and 50% off subsequent drinks', async () => {
    const sessionId = 'session-1';
    const userId = 'user-1';

    prisma.eventSession.findUnique.mockResolvedValue({ id: sessionId, eventId: 'event-1' });
    prisma.eventRegistration.findFirst.mockResolvedValue({
      id: 'reg-1',
      freedrink: true,
      status: 'CHECKED_IN',
    });
    prisma.order.findMany.mockResolvedValue([]);

    // Return Decimal instances, matching Prisma's actual behavior
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', name: 'Trà Sữa', basePrice: new Decimal(40000), isAvailable: true },
    ]);

    let capturedData: any;
    prisma.order.create.mockImplementation(async ({ data }: any) => {
      capturedData = data;
      return { id: 'order-1', ...data, items: data.items?.create ?? [] };
    });

    await service.createOrder(userId, {
      sessionId,
      items: [{ menuItemId: 'item-1', quantity: 3 }],
    });

    // 3 drinks at 40,000 each
    // Drink 1: FREE (40,000 discount)
    // Drink 2: 50% off = 20,000
    // Drink 3: 50% off = 20,000
    // Total: 120,000 | Discount: 80,000 | Final: 40,000
    expect(capturedData.totalAmount.toNumber()).toBe(120000);
    expect(capturedData.discountAmount.toNumber()).toBe(80000);
    expect(capturedData.finalAmount.toNumber()).toBe(40000);

    const items = capturedData.items.create;
    expect(items[0].isFree).toBe(true);
    expect(items[0].finalPrice.toNumber()).toBe(0);
    expect(items[1].isFree).toBe(false);
    expect(items[1].finalPrice.toNumber()).toBe(20000);
    expect(items[2].isFree).toBe(false);
    expect(items[2].finalPrice.toNumber()).toBe(20000);
  });

  it('should not give free drink if already used in session', async () => {
    const sessionId = 'session-1';
    const userId = 'user-1';

    prisma.eventSession.findUnique.mockResolvedValue({ id: sessionId, eventId: 'event-1' });
    prisma.eventRegistration.findFirst.mockResolvedValue({
      id: 'reg-1',
      freedrink: true,
      status: 'CHECKED_IN',
    });

    // Prior order already has a free item
    prisma.order.findMany.mockResolvedValue([
      { id: 'prev-order', items: [{ isFree: true }] },
    ]);

    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', name: 'Cà Phê', basePrice: new Decimal(30000), isAvailable: true },
    ]);

    let capturedData: any;
    prisma.order.create.mockImplementation(async ({ data }: any) => {
      capturedData = data;
      return { id: 'order-2', ...data, items: [] };
    });

    await service.createOrder(userId, {
      sessionId,
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    });

    // 50% off (no free drink remaining): 30,000 * 0.5 = 15,000
    expect(capturedData.finalAmount.toNumber()).toBe(15000);
    expect(capturedData.items.create[0].isFree).toBe(false);
  });
});
