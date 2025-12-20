'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts/sidebar';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Loading } from '@/components/ui/loading';
import { useActiveAds, useTrackAdView, useTrackAdClick } from '@/lib/api/hooks/use-ads';
import { AdType } from '@/lib/api/ads.service';

export default function AdPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const adId = params.adId as string;
    const returnUrl = searchParams.get('return') || '/';
    const storySlug = searchParams.get('story');
    const nextChapterSlug = searchParams.get('next');
    const prevChapterSlug = searchParams.get('prev');

    const { data: popupAds = [], isLoading } = useActiveAds(AdType.POPUP);
    const trackAdView = useTrackAdView();
    const trackAdClick = useTrackAdClick();

    const [selectedAd, setSelectedAd] = useState<any>(null);
    const hasTrackedView = useRef<string | null>(null); // Track which ad ID has been tracked
    const lastAdIdRef = useRef<string | null>(null); // Track last processed adId

    // Separate effect for setting ad
    useEffect(() => {
        if (isLoading || popupAds.length === 0) return;

        // Reset tracking when adId changes
        if (lastAdIdRef.current !== adId) {
            hasTrackedView.current = null;
            lastAdIdRef.current = adId;
            setSelectedAd(null); // Reset selected ad
        }

        // Find ad by ID, or use first available ad
        const ad = popupAds.find((a: any) => a.id === adId) || popupAds[0];
        if (ad && (!selectedAd || selectedAd.id !== ad.id)) {
            setSelectedAd(ad);
        }
    }, [adId, isLoading, popupAds.length]); // Only depend on length, not the array itself

    // Separate effect for tracking view (only once per ad)
    useEffect(() => {
        if (!selectedAd?.id || hasTrackedView.current === selectedAd.id) return;
        
        hasTrackedView.current = selectedAd.id;
        // Use setTimeout to avoid calling in render
        const timer = setTimeout(() => {
            trackAdView.mutate(selectedAd.id);
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedAd?.id]); // Only depend on ad ID

    const handleContinue = () => {
        if (nextChapterSlug && storySlug) {
            router.push(`/stories/${storySlug}/chapters/${nextChapterSlug}`);
        } else if (prevChapterSlug && storySlug) {
            router.push(`/stories/${storySlug}/chapters/${prevChapterSlug}`);
        } else {
            router.push(returnUrl);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900">
                <Sidebar />
                <div className="md:ml-[120px]">
                    <Header />
                    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                        <Loading />
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedAd) {
        return (
            <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900">
                <Sidebar />
                <div className="md:ml-[120px]">
                    <Header />
                    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Không tìm thấy quảng cáo
                            </h1>
                            <button
                                onClick={handleContinue}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                            >
                                Tiếp tục đọc
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900 transition-colors duration-300">
            <Sidebar />
            <div className="md:ml-[120px] pb-16 md:pb-0">
                <Header />
                <main className="pt-4 md:pt-8 pb-12 min-h-[calc(100vh-60px)]">
                    <div className="max-w-4xl mx-auto px-4 md:px-6">
                        {/* Story Header (if available) */}
                        {storySlug && (
                            <div className="mb-6">
                                <Link
                                    href={`/books/${storySlug}`}
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-2 inline-block text-left"
                                >
                                    ← Quay lại truyện
                                </Link>
                            </div>
                        )}

                        {/* Ad Content - Displayed like chapter content */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 lg:p-12 shadow-sm">
                            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                                {selectedAd.imageUrl ? (
                                    <div className="w-full max-w-2xl">
                                        {selectedAd.linkUrl ? (
                                            <a
                                                href={selectedAd.linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full"
                                                onClick={() => {
                                                    if (selectedAd.id) {
                                                        trackAdClick.mutate(selectedAd.id);
                                                    }
                                                }}
                                            >
                                                <div className="relative w-full h-[60vh] min-h-[400px] max-h-[800px]">
                                                    <Image
                                                        src={selectedAd.imageUrl}
                                                        alt={selectedAd.title || 'Quảng cáo'}
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 768px) 100vw, 800px"
                                                    />
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="relative w-full h-[60vh] min-h-[400px] max-h-[800px]">
                                                <Image
                                                    src={selectedAd.imageUrl}
                                                    alt={selectedAd.title || 'Quảng cáo'}
                                                    fill
                                                    className="object-contain"
                                                    sizes="(max-width: 768px) 100vw, 800px"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        <p>Không có hình ảnh quảng cáo</p>
                                    </div>
                                )}

                                {/* Continue Button */}
                                <div className="mt-8 w-full max-w-2xl">
                                    <button
                                        onClick={handleContinue}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 rounded-lg text-white font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                                    >
                                        Tiếp tục đọc
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
}

