import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PhotosService } from './photos.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@ApiTags('Photos')
@Controller('api/photos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  @Post('match/:matchId')
  @UseGuards(RolesGuard)
  @Roles(Role.USER, Role.MC, Role.ADMIN)
  @ApiOperation({ summary: 'Upload match commemoration photo (participants & MC)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: join(
          process.cwd(),
          process.env.STORAGE_PATH ?? 'uploads',
          'match-photos',
        ),
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only JPEG, PNG, and WebP images are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async uploadPhoto(
    @Param('matchId') matchId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Photo file is required');
    return this.photosService.saveMatchPhoto(matchId, userId, file, userRole);
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get match photo (only accessible by matched users)' })
  getPhoto(
    @Param('matchId') matchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.photosService.getMatchPhoto(matchId, userId);
  }
}
