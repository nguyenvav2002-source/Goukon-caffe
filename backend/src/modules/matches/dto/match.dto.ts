import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchChoice } from '@prisma/client';

export class SubmitChoiceDto {
  @ApiProperty()
  @IsString()
  matchId: string;

  @ApiProperty({ enum: MatchChoice })
  @IsEnum(MatchChoice)
  choice: MatchChoice;
}

export class CreateMatchDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Array of exactly 2 user IDs for this match pair' })
  userIds: string[];
}
