/**
 * Utility to track reading progress across all stories
 * Tracks visited chapters (when user accesses a chapter page)
 * Includes time-based tracking, reading progress, and delay management
 */

const STORAGE_KEY = 'reading_tracker';
const DEFAULT_POPUP_INTERVAL = 3; // Default: Show popup every 3 chapters visited
const MIN_VISIT_INTERVAL = 10000; // Minimum 10 seconds between visits to count (ms)
const MIN_READING_TIME = 5000; // Minimum 5 seconds reading time to count as valid visit (ms)
const POPUP_DELAY = 2000; // Delay 2 seconds before showing popup (ms)
const POPUP_COOLDOWN = 300000; // 5 minutes cooldown between popups (ms)

interface ReadingTracker {
    visitedChapters: string[]; // Array of unique chapter IDs that have been visited
    lastPopupChapter: string | null; // Last chapter ID that triggered a popup
    lastPopupVisitCount: number; // Visit count when last popup was shown
    lastPopupAdIndex: number; // Index of last popup ad shown (for rotation)
    lastPopupTimestamp: number; // Timestamp when last popup was shown
    popupCount: number; // Number of popups shown
    visitCount: number; // Total number of chapter visits (increments every time a chapter is accessed)
    lastVisitTimestamp: number; // Timestamp of last visit
    chapterReadingTime: Record<string, number>; // Reading time per chapter (ms)
    chapterScrollProgress: Record<string, number>; // Scroll progress per chapter (0-100)
}

/**
 * Get reading tracker from localStorage
 */
export function getReadingTracker(): ReadingTracker {
    if (typeof window === 'undefined') {
        return {
            visitedChapters: [],
            lastPopupChapter: null,
            lastPopupVisitCount: 0,
            lastPopupAdIndex: -1,
            lastPopupTimestamp: 0,
            popupCount: 0,
            visitCount: 0,
            lastVisitTimestamp: 0,
            chapterReadingTime: {},
            chapterScrollProgress: {},
        };
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Migrate old format to new format
            if (parsed.completedChapters && !parsed.visitedChapters) {
                parsed.visitedChapters = parsed.completedChapters;
                delete parsed.completedChapters;
            }
            // Ensure visitCount exists
            if (typeof parsed.visitCount !== 'number') {
                parsed.visitCount = parsed.visitedChapters?.length || 0;
            }
            return {
                visitedChapters: parsed.visitedChapters || [],
                lastPopupChapter: parsed.lastPopupChapter || null,
                lastPopupVisitCount: parsed.lastPopupVisitCount || 0,
                lastPopupAdIndex: parsed.lastPopupAdIndex ?? -1,
                lastPopupTimestamp: parsed.lastPopupTimestamp || 0,
                popupCount: parsed.popupCount || 0,
                visitCount: parsed.visitCount || (parsed.visitedChapters?.length || 0),
                lastVisitTimestamp: parsed.lastVisitTimestamp || 0,
                chapterReadingTime: parsed.chapterReadingTime || {},
                chapterScrollProgress: parsed.chapterScrollProgress || {},
            };
        }
    } catch (error) {
        console.error('Error reading reading tracker:', error);
    }

    return {
        visitedChapters: [],
        lastPopupChapter: null,
        lastPopupVisitCount: 0,
        lastPopupAdIndex: -1,
        lastPopupTimestamp: 0,
        popupCount: 0,
        visitCount: 0,
        lastVisitTimestamp: 0,
        chapterReadingTime: {},
        chapterScrollProgress: {},
    };
}

/**
 * Save reading tracker to localStorage
 */
export function saveReadingTracker(tracker: ReadingTracker): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
    } catch (error) {
        console.error('Error saving reading tracker:', error);
    }
}

/**
 * Mark a chapter as visited (just accessed the page)
 * Simplified: Every time user enters a chapter page = 1 visit
 * visitCount is saved to localStorage immediately
 */
export function markChapterCompleted(chapterId: string): boolean {
    const tracker = getReadingTracker();
    const now = Date.now();

    // Check if already visited
    const isNewVisit = !tracker.visitedChapters.includes(chapterId);

    if (isNewVisit) {
        // Add to visited chapters
        tracker.visitedChapters.push(chapterId);
    }

    // Always increment visit count (every time user enters a chapter = 1 visit)
    tracker.visitCount += 1;
    tracker.lastVisitTimestamp = now;

    // Initialize reading time for this chapter if not exists
    if (!tracker.chapterReadingTime[chapterId]) {
        tracker.chapterReadingTime[chapterId] = 0;
    }

    // Save to localStorage immediately
    saveReadingTracker(tracker);

    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
        console.log('Chapter visit tracked:', {
            chapterId,
            visitCount: tracker.visitCount,
            isNewVisit,
        });
    }

    return isNewVisit;
}

/**
 * Update reading time for a chapter
 */
export function updateChapterReadingTime(chapterId: string, readingTime: number): void {
    const tracker = getReadingTracker();
    tracker.chapterReadingTime[chapterId] = (tracker.chapterReadingTime[chapterId] || 0) + readingTime;
    saveReadingTracker(tracker);
}

/**
 * Update scroll progress for a chapter
 */
export function updateChapterScrollProgress(chapterId: string, progress: number): void {
    const tracker = getReadingTracker();
    tracker.chapterScrollProgress[chapterId] = Math.max(
        tracker.chapterScrollProgress[chapterId] || 0,
        progress
    );
    saveReadingTracker(tracker);
}

/**
 * Check if chapter has valid reading (minimum time and scroll progress)
 */
export function hasValidReading(chapterId: string): boolean {
    const tracker = getReadingTracker();
    const readingTime = tracker.chapterReadingTime[chapterId] || 0;
    const scrollProgress = tracker.chapterScrollProgress[chapterId] || 0;

    // Valid if: reading time >= minimum OR scroll progress >= 50%
    return readingTime >= MIN_READING_TIME || scrollProgress >= 50;
}

/**
 * Mark a chapter as visited (alias for markChapterCompleted)
 */
export function markChapterVisited(chapterId: string): boolean {
    return markChapterCompleted(chapterId);
}

/**
 * Check if should show popup ad
 * Simplified: Show popup every N chapter visits (default 3)
 * Every time user enters a chapter = 1 visit
 * Logic: After visiting N chapters, the next chapter visit will show popup
 * Example: Visit chapters 1,2,3 -> Chapter 4 will show popup
 * 
 * Note: visitCount is already incremented by markChapterCompleted before this check
 */
export function shouldShowPopup(chapterId: string, popupInterval?: number): boolean {
    const tracker = getReadingTracker();
    const now = Date.now();
    const interval = popupInterval || DEFAULT_POPUP_INTERVAL;

    // Calculate visits since last popup using visitCount
    // visitCount is already incremented by markChapterCompleted before this check
    // Ensure lastPopupVisitCount is always a number
    const lastPopupVisitCount = typeof tracker.lastPopupVisitCount === 'number' ? tracker.lastPopupVisitCount : 0;
    const visitsSinceLastPopup = tracker.visitCount - lastPopupVisitCount;

    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
        console.log('Checking popup:', {
            chapterId,
            visitCount: tracker.visitCount,
            lastPopupVisitCount: tracker.lastPopupVisitCount,
            visitsSinceLastPopup,
            interval,
            condition: `visitsSinceLastPopup === ${interval + 1} && visitCount > ${interval}`,
            result: visitsSinceLastPopup === interval + 1 && tracker.visitCount > interval,
        });
    }

    // Show popup when we've visited exactly (interval + 1) chapters since last popup
    // This means: after visiting N chapters, the (N+1)th chapter will show popup
    // Example with interval=3:
    // - Chapter 1: visitCount=1, lastPopupVisitCount=0, visitsSinceLastPopup=1, 1 === 4? → false ✅
    // - Chapter 2: visitCount=2, lastPopupVisitCount=0, visitsSinceLastPopup=2, 2 === 4? → false ✅
    // - Chapter 3: visitCount=3, lastPopupVisitCount=0, visitsSinceLastPopup=3, 3 === 4? → false ✅
    // - Chapter 4: visitCount=4, lastPopupVisitCount=0, visitsSinceLastPopup=4, 4 === 4? → true ✅

    // After popup shown, lastPopupVisitCount = 4:
    // - Chapter 5: visitCount=5, lastPopupVisitCount=4, visitsSinceLastPopup=1, 1 === 4? → false ✅
    // - Chapter 6: visitCount=6, lastPopupVisitCount=4, visitsSinceLastPopup=2, 2 === 4? → false ✅
    // - Chapter 7: visitCount=7, lastPopupVisitCount=4, visitsSinceLastPopup=3, 3 === 4? → false ✅
    // - Chapter 8: visitCount=8, lastPopupVisitCount=4, visitsSinceLastPopup=4, 4 === 4? → true ✅

    // Ensure we don't show popup on first visit if lastPopupVisitCount is 0
    // Only show if visitsSinceLastPopup is exactly interval + 1
    if (visitsSinceLastPopup === interval + 1 && tracker.visitCount > interval) {
        // Mark this chapter as the last popup trigger and save current visit count
        tracker.lastPopupChapter = chapterId;
        tracker.lastPopupVisitCount = tracker.visitCount;
        tracker.lastPopupTimestamp = now;
        tracker.popupCount += 1;
        saveReadingTracker(tracker);

        // Log for debugging (development only)
        if (process.env.NODE_ENV === 'development') {
            console.log('Popup should be shown:', { chapterId, visitCount: tracker.visitCount, visitsSinceLastPopup });
        }

        return true;
    }

    return false;
}

/**
 * Get popup delay in milliseconds
 */
export function getPopupDelay(): number {
    return POPUP_DELAY;
}

/**
 * Get the next popup ad index for rotation
 * Rotates through available ads to show different ads each time
 */
export function getNextPopupAdIndex(totalAds: number): number {
    if (totalAds === 0) return -1;
    if (totalAds === 1) return 0;

    const tracker = getReadingTracker();
    // Rotate: next index, or 0 if we've gone through all ads
    const nextIndex = (tracker.lastPopupAdIndex + 1) % totalAds;
    tracker.lastPopupAdIndex = nextIndex;
    saveReadingTracker(tracker);
    return nextIndex;
}

/**
 * Get the next banner ad index for rotation
 */
export function getNextBannerAdIndex(totalAds: number): number {
    if (totalAds === 0) return -1;
    if (totalAds === 1) return 0;

    // For banners, we can use a simple round-robin or random
    // Using round-robin based on visitCount for consistency
    const tracker = getReadingTracker();
    // Use a separate counter for banners (or reuse visitCount)
    const bannerIndex = tracker.visitCount % totalAds;
    return bannerIndex;
}

/**
 * Get current visit count from localStorage
 * Easy access to visit count without getting full tracker
 */
export function getVisitCount(): number {
    const tracker = getReadingTracker();
    return tracker.visitCount;
}

/**
 * Reset reading tracker (for testing)
 */
export function resetReadingTracker(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);

    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
        console.log('Reading tracker reset');
    }
}

