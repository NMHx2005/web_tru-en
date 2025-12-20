import { Module, forwardRef } from '@nestjs/common';
import { ChaptersController, AdminChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ApprovalsModule),
  ],
  controllers: [ChaptersController, AdminChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule { }

