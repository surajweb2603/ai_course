'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth';
import { videos as videoApi } from '@/lib/api';
import { setAuthToken } from '@/lib/api';
import { normalizeYouTubeEmbedUrl } from '../utils/youtube';

type VideoProvider = 'youtube';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  provider: VideoProvider;
  channelTitle?: string;
  publishedAt?: string;
  duration?: string;
  viewCount?: string;
  embedUrl?: string; // YouTube
}

interface VideoEmbedProps {
  topic: string;
  className?: string;
}

export default function VideoEmbed({ topic, className = '' }: VideoEmbedProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topic.trim()) return;

    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getToken();
        
        if (!token) {
          setError('Please log in to view related videos.');
          setLoading(false);
          return;
        }
        
        // Set auth token for API client
        setAuthToken(token);
        
        // Call backend directly
        const data = await videoApi.search(topic);
        setVideos((data.videos || []) as VideoItem[]);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to fetch videos');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [topic]);

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading videos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">Failed to load videos</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="text-center py-4">
          <p className="text-gray-600">No videos found for this topic.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={`${video.provider}-${video.id}`}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 hover:shadow-md transition-all shadow-sm"
          >
            <div className="aspect-video bg-black/40 relative">
              {video.provider === 'youtube' && video.embedUrl ? (
                (() => {
                  const normalizedUrl = normalizeYouTubeEmbedUrl(video.embedUrl);
                  return normalizedUrl ? (
                    <iframe
                      src={normalizedUrl}
                      title={video.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      frameBorder="0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-600 text-sm">Invalid video URL</p>
                    </div>
                  );
                })()
              ) : null}
            </div>
            <div className="p-4">
              <h4 className="text-gray-900 font-semibold text-sm line-clamp-2 mb-2">
                {video.title}
              </h4>
              <p className="text-gray-600 text-xs mb-2">
                {video.channelTitle || ''}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatViewCount(video.viewCount)}</span>
                <span>{formatDuration(video.duration)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatViewCount(viewCount?: string): string {
  if (!viewCount) return '';
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

function formatDuration(duration?: string): string {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
