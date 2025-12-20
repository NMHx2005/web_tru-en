import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followsService, Follow, FollowResponse } from '../follows.service';

export const useCheckFollowing = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['follows', 'check', storyId],
    queryFn: () => followsService.checkFollowing(storyId),
    enabled: enabled && !!storyId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useFollowStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => followsService.followStory(storyId),
    onSuccess: (data, storyId) => {
      // Optimistic update - set state immediately
      queryClient.setQueryData(['follows', 'check', storyId], { isFollowing: true });
      // Invalidate related queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['follows', 'check', storyId] });
      queryClient.invalidateQueries({ queryKey: ['follows', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['stories', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};

export const useUnfollowStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => followsService.unfollowStory(storyId),
    onSuccess: (data, storyId) => {
      // Optimistic update - set state immediately
      queryClient.setQueryData(['follows', 'check', storyId], { isFollowing: false });
      // Invalidate related queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['follows', 'check', storyId] });
      queryClient.invalidateQueries({ queryKey: ['follows', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['stories', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};

export const useMyFollows = (query?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['follows', 'my', query],
    queryFn: () => followsService.getMyFollows(query),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useStoryFollowers = (storyId: string, query?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['follows', 'story', storyId, query],
    queryFn: () => followsService.getStoryFollowers(storyId, query),
    enabled: !!storyId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

