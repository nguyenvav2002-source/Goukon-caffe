import { PrismaClient, EventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Gōkon database...');

  // ── Rooms ──────────────────────────────────────────────
  const rooms = await Promise.all([
    // Floor 1: 1v1 rooms
    ...Array.from({ length: 4 }, (_, i) =>
      prisma.room.upsert({
        where: { id: `room-1v1-${i + 1}` },
        update: {},
        create: {
          id: `room-1v1-${i + 1}`,
          name: `Phòng 10${i + 1}`,
          floor: 1,
          capacity: 2,
          eventType: EventType.ONE_VS_ONE,
        },
      }),
    ),
    // Floor 2: 3v3 rooms
    ...Array.from({ length: 4 }, (_, i) =>
      prisma.room.upsert({
        where: { id: `room-3v3-${i + 1}` },
        update: {},
        create: {
          id: `room-3v3-${i + 1}`,
          name: `Phòng 20${i + 1}`,
          floor: 2,
          capacity: 6,
          eventType: EventType.THREE_VS_THREE,
        },
      }),
    ),
    // Floor 3: 5v5 outdoor
    prisma.room.upsert({
      where: { id: 'room-5v5-outdoor' },
      update: {},
      create: {
        id: 'room-5v5-outdoor',
        name: 'Sân Thượng – Ngoài Trời',
        floor: 3,
        capacity: 10,
        eventType: EventType.FIVE_VS_FIVE,
      },
    }),
  ]);
  console.log(`✅ Created ${rooms.length} rooms`);

  // ── Menu Items ─────────────────────────────────────────
  const menuItems = [
    { name: 'Trà Sữa Trân Châu', category: 'drink', basePrice: '45000' },
    { name: 'Cà Phê Sữa Đá', category: 'drink', basePrice: '35000' },
    { name: 'Nước Ép Cam', category: 'drink', basePrice: '40000' },
    { name: 'Sinh Tố Dâu', category: 'drink', basePrice: '50000' },
    { name: 'Matcha Latte', category: 'drink', basePrice: '55000' },
    { name: 'Nước Suối', category: 'drink', basePrice: '15000' },
    { name: 'Soda Chanh', category: 'drink', basePrice: '35000' },
    { name: 'Cà Phê Đen', category: 'drink', basePrice: '30000' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        category: item.category,
        basePrice: item.basePrice,
      },
    });
  }
  console.log(`✅ Created ${menuItems.length} menu items`);

  // ── Demo Accounts ──────────────────────────────────────
  const demoPassword = await bcrypt.hash('demo1234', 12);

  await prisma.user.upsert({
    where: { email: 'mc@gokon.vn' },
    update: {},
    create: {
      email: 'mc@gokon.vn',
      passwordHash: demoPassword,
      displayName: 'MC Gōkon',
      role: 'MC',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@gokon.vn' },
    update: {},
    create: {
      email: 'staff@gokon.vn',
      passwordHash: demoPassword,
      displayName: 'Staff Gōkon',
      role: 'STAFF',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user1@gokon.vn' },
    update: {},
    create: {
      email: 'user1@gokon.vn',
      passwordHash: demoPassword,
      displayName: 'Minh Khoa',
      role: 'USER',
      gender: 'male',
      birthYear: 1998,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user2@gokon.vn' },
    update: {},
    create: {
      email: 'user2@gokon.vn',
      passwordHash: demoPassword,
      displayName: 'Thanh Tâm',
      role: 'USER',
      gender: 'female',
      birthYear: 2000,
    },
  });

  console.log('✅ Created demo accounts');

  // ── Sample Events ──────────────────────────────────────
  await prisma.event.upsert({
    where: { id: 'event-1v1-demo' },
    update: {},
    create: {
      id: 'event-1v1-demo',
      title: 'Gōkon Night – 1v1 Tháng 6',
      description: 'Đêm hẹn hò lãng mạn dành cho 2 người',
      eventType: EventType.ONE_VS_ONE,
      status: 'OPEN',
      maxSlots: 2,
      price: '150000',
      scheduledAt: new Date('2024-06-20T19:00:00Z'),
      durationMin: 90,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event-3v3-demo' },
    update: {},
    create: {
      id: 'event-3v3-demo',
      title: 'Gōkon Party – 3v3 Tháng 6',
      description: 'Buổi hẹn hò nhóm vui nhộn 3 vs 3',
      eventType: EventType.THREE_VS_THREE,
      status: 'OPEN',
      maxSlots: 6,
      price: '120000',
      scheduledAt: new Date('2024-06-22T19:00:00Z'),
      durationMin: 120,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event-5v5-demo' },
    update: {},
    create: {
      id: 'event-5v5-demo',
      title: 'Gōkon Ngoài Trời – 5v5 Tháng 6',
      description: 'Đêm sân thượng dưới bầu trời đầy sao',
      eventType: EventType.FIVE_VS_FIVE,
      status: 'OPEN',
      maxSlots: 10,
      price: '100000',
      scheduledAt: new Date('2024-06-25T18:00:00Z'),
      durationMin: 150,
    },
  });

  const demoSession = await prisma.eventSession.upsert({
    where: { id: 'session-1v1-demo' },
    update: {},
    create: {
      id: 'session-1v1-demo',
      eventId: 'event-1v1-demo',
      roomId: 'room-1v1-1',
    },
  });

  const demoUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'user1@gokon.vn' },
  });

  await prisma.eventRegistration.upsert({
    where: {
      eventId_userId: {
        eventId: 'event-1v1-demo',
        userId: demoUser.id,
      },
    },
    update: { status: 'CHECKED_IN' },
    create: {
      eventId: 'event-1v1-demo',
      userId: demoUser.id,
      status: 'CHECKED_IN',
    },
  });

  const demoDrink = await prisma.menuItem.findFirstOrThrow({
    where: { isAvailable: true },
  });
  await prisma.payment.deleteMany({ where: { orderId: 'order-demo-pending' } });
  await prisma.orderItem.deleteMany({ where: { orderId: 'order-demo-pending' } });
  await prisma.order.deleteMany({ where: { id: 'order-demo-pending' } });
  await prisma.order.create({
    data: {
      id: 'order-demo-pending',
      userId: demoUser.id,
      sessionId: demoSession.id,
      status: 'PENDING',
      totalAmount: demoDrink.basePrice.mul(2),
      discountAmount: demoDrink.basePrice.add(demoDrink.basePrice.mul(0.5)),
      finalAmount: demoDrink.basePrice.mul(0.5),
      note: 'Demo order for staff payment test',
      items: {
        create: [
          {
            menuItemId: demoDrink.id,
            quantity: 1,
            unitPrice: demoDrink.basePrice,
            isFree: true,
            discount: '1',
            finalPrice: '0',
          },
          {
            menuItemId: demoDrink.id,
            quantity: 1,
            unitPrice: demoDrink.basePrice,
            isFree: false,
            discount: '0.5',
            finalPrice: demoDrink.basePrice.mul(0.5),
          },
        ],
      },
    },
  });

  console.log('✅ Created sample events');
  console.log('✅ Created demo session, check-in, and pending order');
  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts (password: demo1234):');
  console.log('  MC:    mc@gokon.vn');
  console.log('  Staff: staff@gokon.vn');
  console.log('  User1: user1@gokon.vn');
  console.log('  User2: user2@gokon.vn');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
