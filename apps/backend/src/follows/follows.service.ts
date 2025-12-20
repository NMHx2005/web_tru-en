import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams, createPaginatedResult } from '../common/utils/pagination.util';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async followStory(userId: string, storyId: string) {
    // Check if story exists
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Truyện không tồn tại');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Bạn đã theo dõi truyện này rồi');
    }

    // Create follow and increment followCount in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const follow = await tx.follow.create({
        data: {
          userId,
          storyId,
        },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
            },
          },
        },
      });

      await tx.story.update({
        where: { id: storyId },
        data: {
          followCount: {
            increment: 1,
          },
        },
      });

      return follow;
    });

    return result;
  }

  async unfollowStory(userId: string, storyId: string) {
    // Check if follow exists
    const follow = await this.prisma.follow.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Bạn chưa theo dõi truyện này');
    }

    // Delete follow and decrement followCount in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: {
          userId_storyId: {
            userId,
            storyId,
          },
        },
      });

      await tx.story.update({
        where: { id: storyId },
        data: {
          followCount: {
            decrement: 1,
          },
        },
      });

      return { success: true };
    });

    return result;
  }

  async isFollowing(userId: string, storyId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    return !!follow;
  }

  async getUserFollows(userId: string, page?: number, limit?: number) {
    const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
      page,
      limit,
    });

    const where = { userId };

    const total = await this.prisma.follow.count({ where });

    const follows = await this.prisma.follow.findMany({
      where,
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            description: true,
            authorName: true,
            viewCount: true,
            followCount: true,
            rating: true,
            ratingCount: true,
            lastChapterAt: true,
            isPublished: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    return createPaginatedResult(follows, total, pageNum, limitNum);
  }

  async getStoryFollowers(storyId: string, page?: number, limit?: number) {
    const { page: pageNum, limit: limitNum, skip } = getPaginationParams({
      page,
      limit,
    });

    // Check if story exists
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Truyện không tồn tại');
    }

    const where = { storyId };

    const total = await this.prisma.follow.count({ where });

    const follows = await this.prisma.follow.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    return createPaginatedResult(follows, total, pageNum, limitNum);
  }
}

