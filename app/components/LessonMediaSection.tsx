'use client';

import { ImageDisplayItem } from '@/components/LessonImageDisplay';
import { Image } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url?: string | null;
  alt?: string;
  prompt?: string | null;
  title?: string;
}

interface LessonMediaSectionProps {
  media: MediaItem[];
}

export function LessonMediaSection({ media }: LessonMediaSectionProps) {
  const images = media.filter((item) => item.type === 'image');

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Image className="w-5 h-5" /> Related Images
      </h4>
      <div className="mb-6">
        {images.slice(0, 1).map((item, idx) => (
          <ImageDisplayItem key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

