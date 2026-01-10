'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/api/auth.service';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');

      if (token) {
        try {
          // Token được set trong cookie từ backend qua redirect response
          // Đợi một chút để đảm bảo cookie được set (đặc biệt trên mobile - có thể cần thời gian lâu hơn)
          await new Promise(resolve => setTimeout(resolve, 800));

          // Thử gọi getMe trực tiếp để đảm bảo cookie đã được set và xác thực thành công
          let authSuccess = false;
          let retries = 0;
          const maxRetries = 5; // Tăng số lần retry cho mobile
          let userData = null;

          while (retries < maxRetries && !authSuccess) {
            try {
              const response = await authService.getMe();
              if (response?.data?.user) {
                authSuccess = true;
                userData = response.data.user;
                // Set user data vào cache ngay lập tức
                queryClient.setQueryData(['auth', 'me'], userData);
              }
            } catch (err: any) {
              retries++;
              if (retries < maxRetries) {
                // Đợi thêm một chút rồi thử lại (đặc biệt quan trọng trên mobile)
                // Tăng delay cho mỗi lần retry
                await new Promise(resolve => setTimeout(resolve, 800 + (retries * 200)));
              } else {
                // Nếu vẫn thất bại sau nhiều lần thử, vẫn tiếp tục nhưng log warning
                console.warn('Failed to verify auth after multiple retries, but continuing...', err);
                // Vẫn invalidate để trang chủ sẽ refetch lại
                queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
              }
            }
          }

          // Nếu đã xác thực thành công, invalidate và refetch queries
          if (authSuccess) {
            // Invalidate để đảm bảo tất cả components được cập nhật
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            // Refetch để đảm bảo data được sync
            await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
          }

          setStatus('success');

          // Đợi thêm một chút để đảm bảo state được cập nhật và cache được sync
          // Đặc biệt quan trọng trên mobile
          await new Promise(resolve => setTimeout(resolve, 500));

          // Redirect về home - sẽ refetch lại user data khi component mount (với retryOnMount: true)
          router.replace('/');
        } catch (error) {
          console.error('Error during auth callback:', error);
          setStatus('error');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        // Nếu không có token, có thể là lỗi hoặc user đã cancel
        setStatus('error');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [searchParams, router, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang xử lý đăng nhập...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="w-full h-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">Đăng nhập thành công!</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Đang chuyển hướng...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="w-full h-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">Đăng nhập thất bại</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Đang chuyển về trang đăng nhập...</p>
          </>
        )}
      </div>
    </div>
  );
}

