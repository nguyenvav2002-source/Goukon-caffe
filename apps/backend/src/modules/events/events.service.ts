import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventType, EventStatus, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/event.dto';

// Slot counts per event type
const EVENT_SLOTS: Record<EventType, number> = {
  ONE_VS_ONE: 2,
  THREE_VS_THREE: 6,
  FIVE_VS_FIVE: 10,
};

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async listEvents(status?: EventStatus, eventType?: EventType) {
    return this.prisma.event.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(eventType ? { eventType } : {}),
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        _count: { select: { registrations: true } },
      },
    });
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
        sessions: {
          include: { room: true },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async createEvent(dto: CreateEventDto) {
    const maxSlots = EVENT_SLOTS[dto.eventType];
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        scheduledAt: new Date(dto.scheduledAt),
        durationMin: dto.durationMin,
        price: dto.price,
        maxSlots,
        status: 'OPEN',
      },
    });
  }

  async registerForEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'OPEN') {
      throw new BadRequestException('Event is not accepting registrations');
    }
    if (event._count.registrations >= event.maxSlots) {
      throw new BadRequestException('Event is full');
    }

    // Check already registered
    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) throw new ConflictException('Already registered for this event');

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: 'PENDING',
        freedrink: true, // First drink is always free
      },
      include: {
        event: {
          select: { title: true, eventType: true, scheduledAt: true, price: true },
        },
      },
    });

    // Auto-close event if full
    const newCount = event._count.registrations + 1;
    if (newCount >= event.maxSlots) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'FULL' },
      });
    }

    return {
      registration,
      promotions: {
        freeDrink: true,
        message: '🎉 Bạn được tặng 1 ly nước MIỄN PHÍ! Các ly tiếp theo giảm 50%.',
        discountRate: 0.5,
      },
    };
  }

  async checkIn(registrationId: string, userId: string) {
    const reg = await this.prisma.eventRegistration.findFirst({
      where: { id: registrationId, userId },
      include: { event: true },
    });

    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.status !== 'PENDING' && reg.status !== 'CONFIRMED') {
      throw new BadRequestException('Invalid registration status for check-in');
    }

    return this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: 'CHECKED_IN' },
      include: {
        event: {
          select: { title: true, eventType: true },
        },
      },
    });
  }

  async getUserRegistrations(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
