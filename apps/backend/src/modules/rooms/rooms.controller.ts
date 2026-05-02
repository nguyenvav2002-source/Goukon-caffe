import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@Controller('api/rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  @ApiQuery({ name: 'eventType', enum: EventType, required: false })
  getRooms(@Query('eventType') eventType?: EventType) {
    return this.roomsService.getRooms(eventType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room details' })
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }
}
