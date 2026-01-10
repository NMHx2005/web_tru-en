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
          // Đợi một chút để đảm bảo cookie được set (đặc biệt trên mobile)
          await new Promise(resolve => setTimeout(resolve, 1200));

          // Thử gọi getMe trực tiếp để đảm bảo cookie đã được set và xác thực thành công
          let authSuccess = false;
          let retries = 0;
          const maxRetries = 8;
          let userData = null;

          while (retries < maxRetries && !authSuccess) {
            try {
              const response = await authService.getMe();
              if (response?.data?.user) {
                authSuccess = true;
                userData = response.data.user;
                queryClient.setQueryData(['auth', 'me'], userData);
              }
            } catch {
              retries++;
              if (retries < maxRetries) {
                const delay = 1000 + (retries * 300);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
              }
            }
          }

          // Invalidate và refetch queries để đảm bảo state được sync
          queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

          if (authSuccess && userData) {
            await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
            await new Promise(resolve => setTimeout(resolve, 300));

            // Verify lại một lần nữa trước khi redirect
            try {
              const finalCheck = await authService.getMe();
              if (!finalCheck?.data?.user) {
                throw new Error('Final verification failed');
              }
            } catch {
              // Continue anyway - cookie may be set
            }
          }

          // Redirect về home - sẽ refetch lại user data khi component mount
          setStatus('success');
          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace('/');
        } catch {
          setStatus('error');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
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

