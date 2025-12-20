import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('stories/:storyId/follow')
  @UseGuards(JwtAuthGuard)
  async followStory(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ) {
    return this.followsService.followStory(user.id, storyId);
  }

  @Delete('stories/:storyId/follow')
  @UseGuards(JwtAuthGuard)
  async unfollowStory(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ) {
    return this.followsService.unfollowStory(user.id, storyId);
  }

  @Get('stories/:storyId/follow')
  @UseGuards(JwtAuthGuard)
  async checkFollowing(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ) {
    const isFollowing = await this.followsService.isFollowing(user.id, storyId);
    return { isFollowing };
  }

  @Get('users/me/follows')
  @UseGuards(JwtAuthGuard)
  async getMyFollows(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.followsService.getUserFollows(
      user.id,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined
    );
  }

  @Public()
  @Get('stories/:storyId/followers')
  async getStoryFollowers(
    @Param('storyId') storyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.followsService.getStoryFollowers(
      storyId,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined
    );
  }
}

