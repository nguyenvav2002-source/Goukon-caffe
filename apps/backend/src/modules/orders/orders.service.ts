import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { Decimal } from '@prisma/client/runtime/library';

const HALF_OFF_DISCOUNT = 0.5;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Verify session exists and user is checked into this event
    const session = await this.prisma.eventSession.findUnique({
      where: { id: dto.sessionId },
      include: { event: true },
    });
    if (!session) throw new NotFoundException('Event session not found');

    // Check user is registered and checked-in for this event
    const registration = await this.prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: session.eventId,
        status: 'CHECKED_IN',
      },
    });
    if (!registration) {
      throw new ForbiddenException('You must be checked in to order');
    }

    // Check if user already used free drink in this event
    const previousOrders = await this.prisma.order.findMany({
      where: { userId, sessionId: dto.sessionId },
      include: { items: true },
    });
    const alreadyUsedFreeDrink = previousOrders.some((order) =>
      order.items.some((item) => item.isFree),
    );
    let freeDrinkRemaining = registration.freedrink && !alreadyUsedFreeDrink;

    // Load menu items
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Some menu items are unavailable or not found');
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    // Build order items with pricing logic:
    // 1st drink: FREE (if eligible)
    // All subsequent drinks: 50% off
    let totalAmount = new Decimal(0);
    let discountAmount = new Decimal(0);
    const orderItemsData: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: Decimal;
      isFree: boolean;
      discount: Decimal;
      finalPrice: Decimal;
    }> = [];

    for (const itemDto of dto.items) {
      const menuItem = menuMap.get(itemDto.menuItemId)!;
      const basePrice = menuItem.basePrice;

      for (let q = 0; q < itemDto.quantity; q++) {
        let isFree = false;
        let discount = new Decimal(0);
        let finalPrice: Decimal;

        if (freeDrinkRemaining) {
          isFree = true;
          discount = basePrice;
          finalPrice = new Decimal(0);
          freeDrinkRemaining = false;
        } else {
          discount = basePrice.mul(HALF_OFF_DISCOUNT);
          finalPrice = basePrice.sub(discount);
        }

        orderItemsData.push({
          menuItemId: itemDto.menuItemId,
          quantity: 1,
          unitPrice: basePrice,
          isFree,
          discount: isFree ? new Decimal(1) : new Decimal(HALF_OFF_DISCOUNT),
          finalPrice,
        });

        totalAmount = totalAmount.add(basePrice);
        discountAmount = discountAmount.add(discount);
      }
    }

    const finalAmount = totalAmount.sub(discountAmount);

    const order = await this.prisma.order.create({
      data: {
        userId,
        sessionId: dto.sessionId,
        note: dto.note,
        totalAmount,
        discountAmount,
        finalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: { menuItem: { select: { name: true, imageUrl: true } } },
        },
      },
    });

    return order;
  }

  async getMenuItems() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { category: 'asc' },
    });
  }

  // Staff: get orders for a specific room (session), WITHOUT personal user info
  async getOrdersBySession(sessionId: string) {
    return this.prisma.order.findMany({
      where: { sessionId },
      select: {
        id: true,
        status: true,
        note: true,
        finalAmount: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            finalPrice: true,
            isFree: true,
            menuItem: {
              select: { name: true, imageUrl: true, category: true },
            },
          },
        },
        // NOTE: user info intentionally NOT included – staff privacy requirement
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    });
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { menuItem: { select: { name: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
