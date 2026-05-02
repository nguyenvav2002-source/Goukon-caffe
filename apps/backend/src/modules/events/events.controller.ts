import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EventStatus, Role } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/event.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Events')
@Controller('api/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List all events (public)' })
  @ApiQuery({ name: 'status', enum: EventStatus, required: false })
  async listEvents(@Query('status') status?: EventStatus) {
    return this.eventsService.listEvents(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MC, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create event (MC / Admin only)' })
  async createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Post(':id/register')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an event (User)' })
  async register(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.registerForEvent(eventId, userId);
  }

  @Post('registrations/:registrationId/check-in')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in to event' })
  async checkIn(
    @Param('registrationId') registrationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.checkIn(registrationId, userId);
  }

  @Get('my/registrations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my event registrations' })
  async myRegistrations(@CurrentUser('id') userId: string) {
    return this.eventsService.getUserRegistrations(userId);
  }
}
