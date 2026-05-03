import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as path from 'path';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {}

  async saveMatchPhoto(
    matchId: string,
    userId: string,
    file: Express.Multer.File,
    userRole?: Role,
  ) {
    // Verify the match exists and is MATCHED
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        choices: true,
        photo: true,
      },
    });

    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== 'MATCHED') {
      throw new ForbiddenException('Photos can only be saved for successful matches');
    }

    // MC and ADMIN can upload photos for any match; participants can only upload for their own
    const isMCOrAdmin = userRole === Role.MC || userRole === Role.ADMIN;
    if (!isMCOrAdmin) {
      const isParticipant = match.choices.some((c) => c.userId === userId);
      if (!isParticipant) {
        throw new ForbiddenException('You are not a participant in this match');
      }
    }

    const fileUrl = `/uploads/match-photos/${path.basename(file.path)}`;

    // Upsert photo record
    const photo = await this.prisma.matchPhoto.upsert({
      where: { matchId },
      create: {
        matchId,
        filePath: file.path,
        fileUrl,
        users: {
          connect: match.choices.map((c) => ({ id: c.userId })),
        },
      },
      update: {
        filePath: file.path,
        fileUrl,
      },
    });

    return {
      photoId: photo.id,
      fileUrl: photo.fileUrl,
      message: '📸 Ảnh kỷ niệm đã được lưu!',
    };
  }

  async getMatchPhoto(matchId: string, userId: string) {
    const photo = await this.prisma.matchPhoto.findUnique({
      where: { matchId },
      include: {
        users: { select: { id: true } },
        match: { select: { status: true } },
      },
    });

    if (!photo) throw new NotFoundException('Photo not found');

    // Only the 2 matched users can access the photo
    const isAuthorized = photo.users.some((u) => u.id === userId);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied');
    }

    return {
      photoId: photo.id,
      fileUrl: photo.fileUrl,
      createdAt: photo.createdAt,
    };
  }
}
