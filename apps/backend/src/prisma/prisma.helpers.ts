import { Prisma } from '@prisma/client';

// Common include types for Story queries
export const storyInclude = {
    author: {
        select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
        },
    },
    storyCategories: {
        include: {
            category: true,
        },
    },
    storyTags: {
        include: {
            tag: true,
        },
    },
    _count: {
        select: {
            chapters: true,
            follows: true,
            favorites: true,
            ratings: true,
        },
    },
} satisfies Prisma.StoryInclude;

// Include for story with chapters
export const storyWithChaptersInclude = {
    ...storyInclude,
    chapters: {
        where: {
            isPublished: true,
        },
        orderBy: {
            order: 'asc',
        },
        select: {
            id: true,
            title: true,
            slug: true,
            order: true,
            viewCount: true,
            createdAt: true,
        },
    },
} satisfies Prisma.StoryInclude;

// Include for chapter with story
export const chapterWithStoryInclude = {
    story: {
        select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            authorId: true,
        },
    },
    uploader: {
        select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
        },
    },
} satisfies Prisma.ChapterInclude;

// Include for comments with nested replies
export const commentInclude = {
    user: {
        select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
        },
    },
    replies: {
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
            createdAt: 'asc',
        },
    },
} satisfies Prisma.CommentInclude;

// Pagination helper
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export function getPaginationParams(params: PaginationParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

// Pagination meta helper
export function getPaginationMeta(
    total: number,
    page: number,
    limit: number
) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

// Safe story select (excludes isRecommended if column doesn't exist)
// Use this instead of storyInclude when column might not exist
export const safeStorySelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    coverImage: true,
    authorId: true,
    authorName: true,
    status: true,
    isPublished: true,
    viewCount: true,
    likeCount: true,
    followCount: true,
    rating: true,
    ratingCount: true,
    country: true,
    tags: true,
    createdAt: true,
    updatedAt: true,
    lastChapterAt: true,
    author: storyInclude.author,
    storyCategories: storyInclude.storyCategories,
    storyTags: storyInclude.storyTags,
    _count: storyInclude._count,
} satisfies Prisma.StorySelect;

