import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Orders')
@Controller('api/orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('menu')
  @ApiOperation({ summary: 'Get drink menu' })
  getMenu() {
    return this.ordersService.getMenuItems();
  }

  @Post()
  @ApiOperation({ summary: 'Place a drink order (User)' })
  createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my orders' })
  myOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.getUserOrders(userId);
  }

  // Staff endpoints
  @Get('session/:sessionId')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.MC, Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders for a session/room (Staff)' })
  getOrdersBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.getOrdersBySession(sessionId);
  }

  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (Staff)' })
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') staffId: string,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto, staffId);
  }
}
