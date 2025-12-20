import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsService, CreateRatingRequest } from '../ratings.service';
import { useToastContext } from '@/components/providers/toast-provider';

// Query keys
export const ratingKeys = {
  all: ['ratings'] as const,
  story: (storyId: string) => [...ratingKeys.all, 'story', storyId] as const,
  user: (storyId: string) => [...ratingKeys.all, 'user', storyId] as const,
  list: (storyId: string) => [...ratingKeys.all, 'list', storyId] as const,
};

// Get user's rating for a story
export function useUserRating(storyId: string) {
  return useQuery({
    queryKey: ratingKeys.user(storyId),
    queryFn: () => ratingsService.getUserRating(storyId),
    enabled: !!storyId,
  });
}

// Get all ratings for a story
export function useStoryRatings(storyId: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: [...ratingKeys.list(storyId), page, limit],
    queryFn: () => ratingsService.getStoryRatings(storyId, page, limit),
    enabled: !!storyId,
  });
}

// Rate a story
export function useRateStory() {
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: CreateRatingRequest }) =>
      ratingsService.rateStory(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.user(variables.storyId) });
      queryClient.invalidateQueries({ queryKey: ratingKeys.list(variables.storyId) });
      queryClient.invalidateQueries({ queryKey: ['stories', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      showToast('Đã đánh giá thành công', 'success');
    },
    onError: () => {
      showToast('Không thể đánh giá. Vui lòng thử lại.', 'error');
    },
  });
}

// Delete rating
export function useDeleteRating() {
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();

  return useMutation({
    mutationFn: (storyId: string) => ratingsService.deleteRating(storyId),
    onSuccess: (_, storyId) => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.user(storyId) });
      queryClient.invalidateQueries({ queryKey: ratingKeys.list(storyId) });
      queryClient.invalidateQueries({ queryKey: ['stories', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      showToast('Đã xóa đánh giá', 'success');
    },
    onError: () => {
      showToast('Không thể xóa đánh giá. Vui lòng thử lại.', 'error');
    },
  });
}

