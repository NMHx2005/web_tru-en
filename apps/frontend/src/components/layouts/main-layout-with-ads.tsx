'use client';

import { ReactNode } from 'react';
import { AdBanner } from '@/components/ads/ad-banner';
import { AdSidebar } from '@/components/ads/ad-sidebar';
import { AdPosition } from '@/lib/api/ads.service';

interface MainLayoutWithAdsProps {
    children: ReactNode;
    showTopBanner?: boolean;
    showBottomBanner?: boolean;
    showSidebar?: boolean;
    sidebarPosition?: 'left' | 'right' | 'both';
    className?: string;
}

/**
 * Main Layout Component with Ad Support
 * Wraps content with top/bottom banners and optional sidebars
 */
export function MainLayoutWithAds({
    children,
    showTopBanner = true,
    showBottomBanner = true,
    showSidebar = false,
    sidebarPosition = 'right',
    className = '',
}: MainLayoutWithAdsProps) {
    return (
        <div className={`min-h-screen ${className}`}>
            {/* Top Banner Ad */}
            {showTopBanner && <AdBanner position={AdPosition.TOP} />}

            {/* Main Content with Sidebars */}
            <div className="max-w-[1920px] mx-auto">
                <div className="flex items-start justify-center">
                    {/* Left Sidebar Ad */}
                    {showSidebar && (sidebarPosition === 'left' || sidebarPosition === 'both') && (
                        <AdSidebar position={AdPosition.SIDEBAR_LEFT} />
                    )}

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>

                    {/* Right Sidebar Ad */}
                    {showSidebar && (sidebarPosition === 'right' || sidebarPosition === 'both') && (
                        <AdSidebar position={AdPosition.SIDEBAR_RIGHT} />
                    )}
                </div>
            </div>

            {/* Bottom Banner Ad */}
            {showBottomBanner && <AdBanner position={AdPosition.BOTTOM} />}
        </div>
    );
}
