'use client';

import { Header } from '@/components/layouts/header';
import { Sidebar } from '@/components/layouts/sidebar';
import { Footer } from '@/components/layouts/footer';
import { Loading } from '@/components/ui/loading';
import { usePage } from '@/lib/api/hooks/use-pages';

interface PageContentProps {
    slug: string;
    fallbackTitle?: string;
}

export function PageContent({ slug, fallbackTitle }: PageContentProps) {
    const { data: page, isLoading, error } = usePage(slug);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900 transition-colors duration-300">
                <Sidebar />
                <div className="md:ml-[120px] pb-16 md:pb-0">
                    <Header />
                    <main className="pt-4 md:pt-8 pb-12 min-h-[calc(100vh-60px)] px-4 md:px-6 lg:px-8">
                        <Loading />
                    </main>
                    <Footer />
                </div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900 transition-colors duration-300">
                <Sidebar />
                <div className="md:ml-[120px] pb-16 md:pb-0">
                    <Header />
                    <main className="pt-4 md:pt-8 pb-12 min-h-[calc(100vh-60px)] px-4 md:px-6 lg:px-8">
                        <div className="max-w-4xl mx-auto text-center py-12">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                {fallbackTitle || 'Trang không tồn tại'}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Trang này chưa có nội dung hoặc đã bị xóa.
                            </p>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900 transition-colors duration-300">
            <Sidebar />
            <div className="md:ml-[120px] pb-16 md:pb-0">
                <Header />
                <main className="pt-4 md:pt-8 pb-12 min-h-[calc(100vh-60px)] px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {page.title}
                        </h1>
                        {page.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {page.description}
                            </p>
                        )}
                        <div
                            className="mt-8 space-y-6 text-base text-gray-700 dark:text-gray-300 leading-relaxed prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
}

