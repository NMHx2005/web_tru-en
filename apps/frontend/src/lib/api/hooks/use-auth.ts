import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService, LoginRequest, RegisterRequest, ChangePasswordRequest } from '../auth.service';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current user
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authService.getMe();
        return response.data?.user;
      } catch (err: any) {
        // If 401 or 404, user is not authenticated - return null silently
        if (err?.response?.status === 401 || err?.response?.status === 404) {
          return null;
        }
        // For other errors, throw to be handled by React Query
        throw err;
      }
    },
    retry: false,
    retryOnMount: true, // Retry on mount to refetch after login redirect
    refetchOnWindowFocus: true, // Refetch on window focus to keep user data fresh
    refetchOnReconnect: true, // Refetch on reconnect
    staleTime: 0, // Set to 0 to always refetch on mount after invalidate (important for mobile after login)
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: async () => {
      try {
        // Đợi một chút để đảm bảo cookie được set (đặc biệt trên mobile)
        await new Promise(resolve => setTimeout(resolve, 300));

        // Thử gọi getMe trực tiếp để đảm bảo cookie đã được set
        let retries = 0;
        const maxRetries = 3;
        let success = false;

        while (retries < maxRetries && !success) {
          try {
            await authService.getMe();
            success = true;
          } catch (err: any) {
            retries++;
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.warn('Failed to verify auth after register, but continuing...', err);
            }
          }
        }

        // Refetch user data và đợi cho nó hoàn thành
        await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });

        // Đợi thêm một chút để đảm bảo state được cập nhật trước khi redirect
        await new Promise(resolve => setTimeout(resolve, 200));

        // Use replace instead of push to avoid adding to history
        router.replace('/');
      } catch (error) {
        console.error('Error during register success handler:', error);
        router.replace('/');
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async () => {
      try {
        // Đợi một chút để đảm bảo cookie được set (đặc biệt trên mobile - có thể cần thời gian lâu hơn)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Thử gọi getMe trực tiếp để đảm bảo cookie đã được set và xác thực thành công
        // Retry logic để handle trường hợp cookie chưa kịp set trên mobile
        let retries = 0;
        const maxRetries = 5; // Tăng số lần retry cho mobile
        let success = false;
        let userData = null;

        while (retries < maxRetries && !success) {
          try {
            const response = await authService.getMe();
            if (response?.data?.user) {
              success = true;
              userData = response.data.user;
              // Set user data vào cache ngay lập tức để components có thể sử dụng
              queryClient.setQueryData(['auth', 'me'], userData);
            }
          } catch (err: any) {
            retries++;
            if (retries < maxRetries) {
              // Đợi thêm một chút rồi thử lại (tăng delay cho mỗi lần retry trên mobile)
              await new Promise(resolve => setTimeout(resolve, 800 + (retries * 200)));
            } else {
              // Nếu vẫn thất bại sau nhiều lần thử, vẫn tiếp tục để tránh block user
              console.warn('Failed to verify auth after login, but continuing...', err);
              // Vẫn invalidate để trang chủ sẽ refetch lại
              queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            }
          }
        }

        // Nếu đã xác thực thành công, invalidate và refetch queries để đảm bảo tất cả components được cập nhật
        if (success) {
          // Invalidate để đánh dấu query là stale, đảm bảo refetch khi component mount
          queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
          // Refetch để đảm bảo data được sync
          await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
        }

        // Đợi thêm một chút để đảm bảo state được cập nhật và cache được sync
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use replace instead of push to avoid adding to history
        router.replace('/');
      } catch (error) {
        console.error('Error during login success handler:', error);
        // Even if refetch fails, still redirect (user might be logged in but query failed)
        // Invalidate để trang chủ sẽ refetch lại
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        router.replace('/');
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      router.push('/login');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: (email: string) => authService.updateEmail(email),
    onSuccess: async () => {
      // Refetch user data after updating email
      await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
    },
  });

  return {
    user: userData,
    isLoading,
    error,
    isAuthenticated: !!userData,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    updateEmail: updateEmailMutation.mutateAsync,
    isUpdatingEmail: updateEmailMutation.isPending,
  };
};

