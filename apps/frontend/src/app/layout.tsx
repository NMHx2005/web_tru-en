import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { MaintenanceCheck } from '@/components/maintenance-check';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Web Truyen Tien Hung',
    template: '%s | Web Truyen Tien Hung',
  },
  description: 'Nền tảng đọc truyện và tiểu thuyết trực tuyến. Khám phá hàng ngàn câu chuyện hay, đa dạng thể loại từ kiếm hiệp, tiên hiệp, ngôn tình đến khoa học viễn tưởng.',
  keywords: ['truyện', 'tiểu thuyết', 'đọc truyện', 'truyện online', 'manga', 'light novel', 'kiếm hiệp', 'tiên hiệp', 'ngôn tình'],
  authors: [{ name: 'Web Truyen Team' }],
  creator: 'Web Truyen Team',
  publisher: 'Web Truyen Team',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://webtruyen.com',
    siteName: 'Web Truyen Tien Hung',
    title: 'Web Truyen Tien Hung - Nền tảng đọc truyện trực tuyến',
    description: 'Nền tảng đọc truyện và tiểu thuyết trực tuyến. Khám phá hàng ngàn câu chuyện hay, đa dạng thể loại.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Truyen Tien Hung',
    description: 'Nền tảng đọc truyện và tiểu thuyết trực tuyến',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider attribute="class" defaultTheme="light">
                <ToastProvider>
                  <MaintenanceCheck>
                    {children}
                  </MaintenanceCheck>
                </ToastProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

