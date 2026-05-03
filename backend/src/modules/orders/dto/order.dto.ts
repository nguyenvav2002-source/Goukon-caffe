import { IsString, IsArray, IsInt, Min, IsOptional, ValidateNested, IsIn, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  menuItemId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;
}

export class PayOrderDto {
  @ApiProperty({ enum: ['CASH', 'BANK_TRANSFER', 'MOMO', 'CARD'], default: 'CASH' })
  @IsIn(['CASH', 'BANK_TRANSFER', 'MOMO', 'CARD'])
  method: string = 'CASH';

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cashReceived?: number;
}
