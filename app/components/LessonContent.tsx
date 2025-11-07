'use client';

import { motion, AnimatePresence } from 'framer-motion';
import MarkdownView from '@/components/MarkdownView';
import VideoEmbed from '@/components/VideoEmbed';
import { ImageDisplayItem } from '@/components/LessonImageDisplay';
import { BookOpen, Lightbulb, PenTool, Key, Image, Video } from 'lucide-react';

interface LessonContentProps {
  activeTab: 'theory' | 'example' | 'exercise' | 'quiz';
  lessonContent: {
    theoryMd: string;
    exampleMd: string;
    exerciseMd: string;
    keyTakeaways: string[];
    media?: Array<{
      type: 'image' | 'video';
      url?: string | null;
      alt?: string;
      prompt?: string | null;
      title?: string;
    }>;
  };
  lessonTitle: string;
}

export function LessonContent({ activeTab, lessonContent, lessonTitle }: LessonContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'theory' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
              <BookOpen className="w-6 h-6" /> Theory
            </h3>
            <div className="text-gray-700">
              <MarkdownView content={lessonContent.theoryMd} />
            </div>

            {lessonContent.keyTakeaways.length > 0 && (
              <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-xl">
                <h4 className="text-lg font-semibold text-purple-600 mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5" /> Key Takeaways
                </h4>
                <ul className="space-y-2">
                  {lessonContent.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-purple-600 mt-1">•</span>
                      <span className="text-gray-700">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lessonContent.media &&
              lessonContent.media.filter((item) => item.type === 'image').length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5" /> Related Images
                  </h4>
                  <div className="mb-6">
                    {lessonContent.media
                      .filter((item) => item.type === 'image')
                      .slice(0, 1)
                      .map((item, idx) => (
                        <ImageDisplayItem key={idx} item={item} />
                      ))}
                  </div>
                </div>
              )}

            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-gray-700" /> Related Videos
              </h4>
              <VideoEmbed topic={lessonTitle} />
            </div>
          </div>
        )}

        {activeTab === 'example' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
              <Lightbulb className="w-6 h-6" /> Example
            </h3>
            <div className="text-gray-700">
              <MarkdownView content={lessonContent.exampleMd} />
            </div>
          </div>
        )}

        {activeTab === 'exercise' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
              <PenTool className="w-6 h-6" /> Exercise
            </h3>
            <div className="text-gray-700">
              <MarkdownView content={lessonContent.exerciseMd} />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

