import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AnalyticsService } from './analytics.service';
import { AdsController } from './ads.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [AdsController],
  providers: [AdsService, AnalyticsService],
  exports: [AdsService, AnalyticsService],
})
export class AdsModule { }

