import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('stories/:storyId')
  @UseGuards(JwtAuthGuard)
  async rateStory(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any,
    @Body() createRatingDto: CreateRatingDto
  ) {
    return this.ratingsService.rateStory(user.id, storyId, createRatingDto);
  }

  @Get('stories/:storyId')
  @UseGuards(JwtAuthGuard)
  async getUserRating(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ) {
    const rating = await this.ratingsService.getUserRating(user.id, storyId);
    return { rating };
  }

  @Delete('stories/:storyId')
  @UseGuards(JwtAuthGuard)
  async deleteRating(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ) {
    return this.ratingsService.deleteRating(user.id, storyId);
  }

  @Public()
  @Get('stories/:storyId/list')
  async getStoryRatings(
    @Param('storyId') storyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.ratingsService.getStoryRatings(
      storyId,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined
    );
  }
}

