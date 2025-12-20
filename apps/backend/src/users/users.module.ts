import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ReadingHistoryModule } from '../reading-history/reading-history.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, forwardRef(() => ReadingHistoryModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

