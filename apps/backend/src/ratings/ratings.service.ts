import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Rate a story (create or update rating)
   */
  async rateStory(userId: string, storyId: string, createRatingDto: CreateRatingDto) {
    // Check if story exists
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true },
    });

    if (!story) {
      throw new NotFoundException('Story không tồn tại');
    }

    // Check if user already rated this story
    const existingRating = await this.prisma.rating.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    let rating;
    if (existingRating) {
      // Update existing rating
      rating = await this.prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating: createRatingDto.rating,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });
    } else {
      // Create new rating
      rating = await this.prisma.rating.create({
        data: {
          userId,
          storyId,
          rating: createRatingDto.rating,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });
    }

    // Recalculate story rating
    await this.updateStoryRating(storyId);

    return rating;
  }

  /**
   * Get user's rating for a story
   */
  async getUserRating(userId: string, storyId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    return rating ? rating.rating : null;
  }

  /**
   * Delete user's rating
   */
  async deleteRating(userId: string, storyId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    if (!rating) {
      throw new NotFoundException('Bạn chưa đánh giá story này');
    }

    await this.prisma.rating.delete({
      where: { id: rating.id },
    });

    // Recalculate story rating
    await this.updateStoryRating(storyId);

    return { success: true, message: 'Đã xóa đánh giá' };
  }

  /**
   * Get all ratings for a story
   */
  async getStoryRatings(storyId: string, page?: number, limit?: number) {
    const pageNum = page || 1;
    const limitNum = limit || 20;
    const skip = (pageNum - 1) * limitNum;

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { storyId },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.rating.count({
        where: { storyId },
      }),
    ]);

    return {
      ratings,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  /**
   * Recalculate and update story rating
   */
  private async updateStoryRating(storyId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { storyId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      // No ratings, set to 0
      await this.prisma.story.update({
        where: { id: storyId },
        data: {
          rating: 0,
          ratingCount: 0,
        },
      });
      return;
    }

    // Calculate average rating
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    // Update story rating
    await this.prisma.story.update({
      where: { id: storyId },
      data: {
        rating: Math.round(average * 10) / 10, // Round to 1 decimal place
        ratingCount: ratings.length,
      },
    });
  }
}

