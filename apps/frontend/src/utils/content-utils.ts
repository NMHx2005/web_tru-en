/**
 * Content Processing Utilities
 * Split content into chunks and insert inline ads
 */

/**
 * Split content into paragraphs and insert inline ads every N paragraphs
 */
export function insertInlineAds(
    content: string,
    adsInterval: number = 5 // Insert ad every 5 paragraphs
): Array<{ type: 'content' | 'ad'; content: string; index: number }> {
    if (!content) return [];

    // Split content by line breaks (paragraphs)
    const paragraphs = content
        .split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const result: Array<{ type: 'content' | 'ad'; content: string; index: number }> = [];
    let adIndex = 0;

    paragraphs.forEach((paragraph, index) => {
        // Add paragraph
        result.push({
            type: 'content',
            content: paragraph,
            index,
        });

        // Insert ad after every N paragraphs (but not after the last paragraph)
        if ((index + 1) % adsInterval === 0 && index < paragraphs.length - 1) {
            result.push({
                type: 'ad',
                content: '', // Ad component will be rendered
                index: adIndex++,
            });
        }
    });

    return result;
}

/**
 * Calculate reading time based on word count
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

/**
 * Extract first N words from content for preview
 */
export function getContentPreview(content: string, wordLimit: number = 50): string {
    const words = content.split(/\s+/);
    if (words.length <= wordLimit) return content;
    return words.slice(0, wordLimit).join(' ') + '...';
}

/**
 * Count words in content
 */
export function countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Remove HTML tags from content (if any)
 */
export function stripHtmlTags(content: string): string {
    return content.replace(/<[^>]*>/g, '');
}
