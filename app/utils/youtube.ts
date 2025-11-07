
/**
 * Utility functions for YouTube video URLs
 */

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  // YouTube short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  // YouTube mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
  const mobileMatch = url.match(/m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (mobileMatch) return mobileMatch[1];

  return null;
}

/**
 * Convert any YouTube URL to a proper embed URL
 */
export function normalizeYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  // Return proper embed URL with recommended parameters
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return extractYouTubeVideoId(url) !== null;
}

