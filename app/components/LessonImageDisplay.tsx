'use client';

import { useState, useEffect } from 'react';
import { imageSearch } from '@/lib/api';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { findValidImageUrl, formatErrorMessage } from '@/app/utils/lessonHelpers';

interface MediaItem {
  type: 'image' | 'video';
  url?: string | null;
  alt?: string;
  prompt?: string | null;
  title?: string;
}

interface ImageErrorDisplayProps {
  item: MediaItem;
  errorMessage: string | null;
  isProxyUrl: boolean;
  retrying: boolean;
  onRetry: () => void;
}

function ImageErrorDisplay({
  item,
  errorMessage,
  isProxyUrl,
  onRetry,
  retrying,
}: ImageErrorDisplayProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600 text-sm font-medium mb-1">Image unavailable</p>
        <p className="text-gray-500 text-xs mb-3">
          {errorMessage ||
            (isProxyUrl
              ? 'The image URL is a proxy link that is no longer accessible. Proxy URLs often fail to load.'
              : 'The image failed to load or is no longer available')}
        </p>
        {item.prompt && (
          <>
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2 text-left">
              <p className="text-purple-600 text-xs font-semibold mb-1">Suggested Image:</p>
              <p className="text-gray-700 text-xs">{item.prompt}</p>
            </div>
            <button
              onClick={onRetry}
              disabled={retrying}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {retrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching for new image...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retry Image Search
                </>
              )}
            </button>
          </>
        )}
      </div>
      {(item.alt || item.title) && (
        <div className="mt-4 mb-2">
          {item.title && <p className="text-gray-900 font-medium text-sm mb-1">{item.title}</p>}
          {item.alt && <p className="text-gray-600 text-sm">{item.alt}</p>}
        </div>
      )}
    </div>
  );
}

interface ImageDisplayProps {
  item: MediaItem;
  displayUrl: string;
  imageLoading: boolean;
  retryUrl: string | null;
  onError: () => void;
  onLoad: () => void;
}

function ImageDisplay({
  item,
  displayUrl,
  imageLoading,
  retryUrl,
  onError,
  onLoad,
}: ImageDisplayProps) {
  return (
    <div className="relative w-full bg-black/40 rounded-lg mb-3 flex items-center justify-center group">
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
      {displayUrl && displayUrl !== 'null' && displayUrl.trim() !== '' ? (
        <a
          href={displayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block"
          title="Click to open in new tab"
        >
          <img
            key={`img-${displayUrl}-${retryUrl ? 'retry' : 'original'}`}
            src={displayUrl}
            alt={item.alt || 'Image'}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onError={onError}
            onLoad={onLoad}
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <div className="bg-white/90 text-black px-3 py-1 rounded-full text-xs font-medium">
              Click to open
            </div>
          </div>
        </a>
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-sm">Invalid image URL</p>
        </div>
      )}
    </div>
  );
}

function useImageRetry(item: MediaItem) {
  const [retrying, setRetrying] = useState(false);
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!item.prompt) return;

    setRetrying(true);
    setErrorMessage(null);
    // Clear previous retry URL to trigger re-render
    setRetryUrl(null);

    try {
      const result = await imageSearch.search({
        query: item.prompt,
        numResults: 5,
      });

      if (result.success && Array.isArray(result.results) && result.results.length > 0) {
        const resolvedUrl = await findValidImageUrl(result.results);

        if (resolvedUrl) {
          setRetryUrl(resolvedUrl);
          setErrorMessage(null);
          // Small delay to ensure state updates propagate
          await new Promise((resolve) => setTimeout(resolve, 100));
          return;
        }

        throw new Error('No valid image URL could be loaded successfully');
      } else {
        throw new Error('No results found for this image search');
      }
    } catch (error: any) {
      setErrorMessage(formatErrorMessage(error));
      // Clear retry URL on error so user can try again
      setRetryUrl(null);
    } finally {
      setRetrying(false);
    }
  };

  return { retryUrl, setRetryUrl, retrying, errorMessage, handleRetry };
}

interface ImageRetryButtonProps {
  retrying: boolean;
  onRetry: () => void;
  errorMessage: string | null;
}

function ImageRetryButton({ retrying, onRetry }: ImageRetryButtonProps) {
  return (
    <div className="mt-4">
      <button
        onClick={onRetry}
        disabled={retrying}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {retrying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Searching for new image...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Retry Image Search
          </>
        )}
      </button>
    </div>
  );
}

export function ImageDisplayItem({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const isProxyUrl = item.url?.includes('r.bing.com/rp/') || false;
  const { retryUrl, setRetryUrl, retrying, errorMessage, handleRetry } = useImageRetry(item);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  useEffect(() => {
    const url = retryUrl || item.url;

    if (!url || url === 'null' || url.trim() === '') {
      setImageError(true);
      setImageLoading(false);
    } else {
      // Reset error state when URL changes (including when retryUrl is set)
      setImageError(false);
      setImageLoading(true);
    }
  }, [item.url, retryUrl]);

  const displayUrl = retryUrl || item.url;

  if (!displayUrl || displayUrl === 'null' || displayUrl.trim() === '') {
    return (
      <ImageErrorDisplay
        item={item}
        errorMessage={errorMessage}
        isProxyUrl={isProxyUrl}
        retrying={retrying}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div>
        <ImageDisplay
          item={item}
          displayUrl={displayUrl}
          imageLoading={imageLoading}
          retryUrl={retryUrl}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {(item.alt || item.title) && (
          <div className="mb-2">
            {item.title && <p className="text-gray-900 font-medium text-sm mb-1">{item.title}</p>}
            {item.alt && <p className="text-gray-600 text-sm">{item.alt}</p>}
          </div>
        )}
        {imageError && item.prompt && (
          <div className="mt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
              <p className="text-purple-600 text-xs font-semibold mb-1">Suggested Image:</p>
              <p className="text-gray-700 text-xs">{item.prompt}</p>
            </div>
            <ImageRetryButton retrying={retrying} onRetry={handleRetry} errorMessage={errorMessage} />
          </div>
        )}
        {item.prompt && !item.url && !retryUrl && !imageError && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-purple-600 text-xs font-semibold mb-1">Suggested Image:</p>
            <p className="text-gray-700 text-xs">{item.prompt}</p>
            <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Images are automatically searched and added during
              content generation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

