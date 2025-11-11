// Helper utilities for lesson page image processing

export const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;
export const HIGH_CONFIDENCE_HOST_REGEX = /(mm\.bing\.net|googleusercontent\.com|gstatic\.com|wikimedia\.org|staticflickr\.com|imgur\.com|unsplash\.com|pexels\.com|cloudfront\.net|blogspot\.com|wordpress\.com|nitrocdn\.com)/i;
export const PROXY_HOST_REGEX = /r\.bing\.com\/rp\//i;

export function normalizeUrl(candidate: unknown): string | null {
  if (!candidate || typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  if (!trimmed || trimmed === 'null' || !/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function computeCandidateScore(url: string, baseScore: number): number {
  const withoutHash = url.split('#')[0];
  const baseUrl = withoutHash.split('?')[0];
  let score = baseScore;

  if (IMAGE_EXTENSION_REGEX.test(baseUrl)) {
    score += 6;
  }
  if (HIGH_CONFIDENCE_HOST_REGEX.test(url)) {
    score += 4;
  }
  if (PROXY_HOST_REGEX.test(url)) {
    score -= 5;
  }
  if (/thumbnail|thumb|preview/.test(url)) {
    score += 1;
  }
  return score;
}

export function extractCandidateUrls(
  rawResult: any,
  index: number
): Array<{ url: string; score: number }> {
  const urls: string[] = [];
  const visited = new Set<object>();

  // First, check if this is an ImageSearchResult structure and extract URLs directly
  if (rawResult && typeof rawResult === 'object') {
    // Check for ImageSearchResult structure: { link, image: { contextLink, thumbnailLink } }
    if (rawResult.link && typeof rawResult.link === 'string' && rawResult.link.startsWith('http')) {
      urls.push(rawResult.link);
    }
    if (rawResult.image) {
      if (rawResult.image.contextLink && typeof rawResult.image.contextLink === 'string' && rawResult.image.contextLink.startsWith('http')) {
        urls.push(rawResult.image.contextLink);
      }
      if (rawResult.image.thumbnailLink && typeof rawResult.image.thumbnailLink === 'string' && rawResult.image.thumbnailLink.startsWith('http')) {
        urls.push(rawResult.image.thumbnailLink);
      }
    }
    // Also check for GISResult structure: { url, thumbnail }
    if (rawResult.url && typeof rawResult.url === 'string' && rawResult.url.startsWith('http')) {
      urls.push(rawResult.url);
    }
    if (rawResult.thumbnail && typeof rawResult.thumbnail === 'string' && rawResult.thumbnail.startsWith('http')) {
      urls.push(rawResult.thumbnail);
    }
  }

  // Fallback: traverse the entire object to find any URLs
  const traverse = (value: any) => {
    if (!value) return;
    if (typeof value === 'string') {
      if (value.startsWith('http')) {
        urls.push(value);
      }
      return;
    }
    if (typeof value === 'object') {
      if (visited.has(value)) return;
      visited.add(value);
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else {
        Object.values(value).forEach(traverse);
      }
    }
  };

  traverse(rawResult);

  const basePriority = Math.max(12 - index, 1);
  return urls
    .map(normalizeUrl)
    .filter((url): url is string => !!url)
    .map((url) => ({
      url,
      score: computeCandidateScore(url, basePriority),
    }));
}

export function preloadImage(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const testImage = new window.Image();
    let settled = false;

    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        testImage.src = '';
        reject(new Error('Timed out while verifying image'));
      }
    }, 8000);

    testImage.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    };

    testImage.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      reject(new Error('Failed to load image'));
    };

    try {
      testImage.crossOrigin = 'anonymous';
    } catch (err) {
      // Ignore if browser blocks setting crossOrigin
    }
    testImage.referrerPolicy = 'no-referrer';
    testImage.decoding = 'async';
    testImage.loading = 'eager';
    testImage.src = url;
  });
}

export function formatErrorMessage(error: any): string {
  if (
    error.code === 'ERR_NETWORK' ||
    error.message?.includes('Network') ||
    error.message?.includes('CONNECTION_REFUSED') ||
    error.response === undefined
  ) {
    return 'Unable to connect to image search service. Please ensure the backend server is running.';
  }
  if (error.response?.status === 401) {
    return 'Authentication required. Please refresh the page and try again.';
  }
  if (error.response?.status >= 500) {
    return 'Image search service error. Please try again later.';
  }
  if (error.message?.includes('No valid image URL')) {
    return 'We found related images but none allow direct viewing. Please retry in a moment or open the suggested query in a new tab.';
  }
  return error.message || 'Failed to find a new image. The image may not be available.';
}

export async function findValidImageUrl(results: any[]): Promise<string | null> {
  const candidateScores = new Map<string, number>();

  results.forEach((rawResult: any, index: number) => {
    const extracted = extractCandidateUrls(rawResult, index);
    extracted.forEach(({ url, score }) => {
      if (!candidateScores.has(url) || candidateScores.get(url)! < score) {
        candidateScores.set(url, score);
      }
    });
  });

  const orderedCandidates = Array.from(candidateScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url);

  for (const candidate of orderedCandidates) {
    try {
      await preloadImage(candidate);
      return candidate;
    } catch (candidateError) {
      // Continue to next candidate if this one fails
    }
  }

  return null;
}

