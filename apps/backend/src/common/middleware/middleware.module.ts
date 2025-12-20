import { Module } from '@nestjs/common';
import { MaintenanceMiddleware } from './maintenance.middleware';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MaintenanceMiddleware],
  exports: [MaintenanceMiddleware, PrismaModule, JwtModule],
})
export class MiddlewareModule { }
