import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PhotosModule } from './modules/photos/photos.module';
import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    // Serve uploaded photos (static)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.STORAGE_PATH ?? 'uploads'),
      serveRoot: '/uploads',
    }),

    // Core
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    EventsModule,
    OrdersModule,
    MatchesModule,
    PhotosModule,
    RoomsModule,
  ],
})
export class AppModule {}
