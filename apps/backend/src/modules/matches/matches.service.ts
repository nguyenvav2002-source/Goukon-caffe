import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitChoiceDto, CreateMatchDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async createMatch(dto: CreateMatchDto) {
    if (dto.userIds.length !== 2) {
      throw new BadRequestException('A match must have exactly 2 users');
    }

    const session = await this.prisma.eventSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    return this.prisma.match.create({
      data: {
        sessionId: dto.sessionId,
        status: 'PENDING',
      },
    });
  }

  async submitChoice(userId: string, dto: SubmitChoiceDto) {
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
      include: { choices: true },
    });

    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== 'PENDING') {
      throw new BadRequestException('Match result already determined');
    }

    const existingChoice = match.choices.find((c) => c.userId === userId);
    if (existingChoice) {
      throw new ConflictException('You have already submitted your choice');
    }

    await this.prisma.matchChoice_.create({
      data: {
        matchId: dto.matchId,
        userId,
        choice: dto.choice,
      },
    });

    const updatedMatch = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
      include: { choices: true },
    });

    if (!updatedMatch) {
      throw new NotFoundException('Match not found after choice submission');
    }

    if (updatedMatch.choices.length === 2) {
      const bothHeart = updatedMatch.choices.every((c) => c.choice === 'HEART');
      const newStatus = bothHeart ? 'MATCHED' : 'NOT_MATCHED';

      const finalMatch = await this.prisma.match.update({
        where: { id: dto.matchId },
        data: { status: newStatus },
        include: { choices: { select: { userId: true, choice: true } } },
      });

      return {
        matchId: finalMatch.id,
        status: finalMatch.status,
        isMatched: newStatus === 'MATCHED',
        myChoice: dto.choice,
        message:
          newStatus === 'MATCHED'
            ? '💚 Match thành công! Chúc mừng!'
            : 'Cảm ơn bạn đã tham gia Gōkon.',
      };
    }

    return {
      matchId: dto.matchId,
      status: 'PENDING',
      message: 'Đã gửi lựa chọn, đang chờ kết quả...',
    };
  }

  async getMatchStatus(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        choices: {
          where: { userId },
        },
        photo: { select: { id: true, fileUrl: true } },
      },
    });

    if (!match) throw new NotFoundException('Match not found');

    return {
      matchId: match.id,
      status: match.status,
      myChoice: match.choices[0]?.choice ?? null,
      photo: match.status === 'MATCHED' ? match.photo : null,
    };
  }

  async getSessionMatchResults(sessionId: string) {
    return this.prisma.match.findMany({
      where: { sessionId },
      include: {
        choices: {
          include: {
            user: {
              select: { id: true, displayName: true },
            },
          },
        },
        photo: { select: { id: true, fileUrl: true } },
      },
    });
  }
}
