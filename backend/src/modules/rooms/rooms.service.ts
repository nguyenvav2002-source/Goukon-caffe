import { Injectable, NotFoundException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async getRooms(eventType?: EventType) {
    return this.prisma.room.findMany({
      where: {
        isActive: true,
        ...(eventType ? { eventType } : {}),
      },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });
  }

  async getRoom(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
}
