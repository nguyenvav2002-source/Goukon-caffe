import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
  IsDecimal,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({ example: 'Gōkon Night – Tháng 5' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ example: 'Đêm hẹn hò đặc biệt tại Gōkon Cafe' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ example: '2024-06-15T18:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(30)
  @Type(() => Number)
  durationMin: number;

  @ApiProperty({ example: '150000' })
  @IsDecimal()
  price: string;
}

export class RegisterEventDto {
  @ApiProperty()
  @IsString()
  eventId: string;
}

export class CheckInDto {
  @ApiProperty()
  @IsString()
  registrationId: string;
}
