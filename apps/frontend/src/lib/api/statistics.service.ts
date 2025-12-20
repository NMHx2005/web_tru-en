import { apiClient } from './client';

export interface DashboardStats {
  totalUsers: number;
  totalStories: number;
  totalChapters: number;
  totalViews: number;
  pendingApprovals: number;
  activeAds: number;
  userGrowth: number[];
  userGrowthLabels: string[];
  storyViews: number[];
  storyViewsLabels: string[];
  categoryDistribution?: {
    labels: string[];
    data: number[];
  };
  userRoleDistribution?: {
    labels: string[];
    data: number[];
  };
  topStories?: Array<{
    id: string;
    title: string;
    viewCount: number;
    authorName: string;
    createdAt: string;
  }>;
}

export const statisticsService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/admin/statistics');
    // Response structure: { success: true, data: { ... } }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return (response.data as any).data as DashboardStats;
    }
    return response.data as DashboardStats;
  },

  async getDashboardStats() {
    const response = await apiClient.get<{ success: boolean; data: any }>('/admin/statistics/dashboard');
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return (response.data as any).data;
    }
    return response.data;
  },

  async getUserGrowth() {
    const response = await apiClient.get<{ success: boolean; data: { data: number[]; labels: string[] } }>('/admin/statistics/user-growth');
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return (response.data as any).data;
    }
    return response.data;
  },

  async getStoryViews() {
    const response = await apiClient.get<{ success: boolean; data: { data: number[]; labels: string[] } }>('/admin/statistics/story-views');
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return (response.data as any).data;
    }
    return response.data;
  },

  // Public statistics
  async getStoryStats(storyId: string) {
    const response = await apiClient.get(`/statistics/stories/${storyId}`);
    return response.data.data || response.data;
  },

  async getPlatformStats() {
    const response = await apiClient.get('/statistics/platform');
    return response.data.data || response.data;
  },

  async getUserActivity(userId: string) {
    const response = await apiClient.get(`/statistics/users/${userId}/activity`);
    return response.data.data || response.data;
  },

  async getPopularStories(timeframe?: 'day' | 'week' | 'month' | 'all', limit?: number) {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (limit) params.append('limit', limit.toString());
    const response = await apiClient.get(`/statistics/popular?${params.toString()}`);
    return response.data.data || response.data;
  },

  async getTrendingStories(limit?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const response = await apiClient.get(`/statistics/trending?${params.toString()}`);
    return response.data.data || response.data;
  },
};

