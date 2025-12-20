import { apiClient } from './client';

export interface Rating {
  id: string;
  userId: string;
  storyId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
}

export interface RatingsResponse {
  ratings: Rating[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRatingRequest {
  rating: number; // 1-5
}

export const ratingsService = {
  // Rate a story
  rateStory: async (storyId: string, data: CreateRatingRequest): Promise<Rating> => {
    const response = await apiClient.post<{ success: boolean; data: Rating }>(
      `/ratings/stories/${storyId}`,
      data
    );
    return response.data.data || response.data;
  },

  // Get user's rating for a story
  getUserRating: async (storyId: string): Promise<number | null> => {
    const response = await apiClient.get<{ success: boolean; data: { rating: number | null } }>(
      `/ratings/stories/${storyId}`
    );
    return response.data.data?.rating ?? null;
  },

  // Delete user's rating
  deleteRating: async (storyId: string): Promise<void> => {
    await apiClient.delete(`/ratings/stories/${storyId}`);
  },

  // Get all ratings for a story
  getStoryRatings: async (
    storyId: string,
    page?: number,
    limit?: number
  ): Promise<RatingsResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<{ success: boolean; data: RatingsResponse }>(
      `/ratings/stories/${storyId}/list?${params.toString()}`
    );
    return response.data.data || response.data;
  },
};

