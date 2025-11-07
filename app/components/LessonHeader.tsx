'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface Lesson {
  _id: string;
  order: number;
  title: string;
  summary?: string;
  content?: any;
}

interface Module {
  _id: string;
  order: number;
  title: string;
}

interface LessonHeaderProps {
  lesson: Lesson;
  module: Module;
  hasContent: boolean;
  isRegenerating: boolean;
  isCompleted: boolean;
  courseProgressSyncing: boolean;
  onGenerateLesson: () => void;
  onToggleComplete: () => void;
}

export function LessonHeader({
  lesson,
  module,
  hasContent,
  isRegenerating,
  isCompleted,
  courseProgressSyncing,
  onGenerateLesson,
  onToggleComplete,
}: LessonHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">
              Module {module.order} · Lesson {lesson.order}
            </span>
            {hasContent && lesson.content?.estimatedMinutes && (
              <span className="text-sm text-gray-600 flex items-center gap-1">
                · <Clock className="w-4 h-4" /> {lesson.content.estimatedMinutes} min
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{lesson.title}</h1>
          {lesson.summary && <p className="text-lg text-gray-600">{lesson.summary}</p>}
        </div>

        <div className="flex flex-col gap-3">
          {!hasContent && (
            <button
              onClick={onGenerateLesson}
              disabled={isRegenerating}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRegenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Lesson
                </>
              )}
            </button>
          )}

          <button
            onClick={onToggleComplete}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isCompleted
                ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:text-purple-600'
            }`}
          >
            {courseProgressSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill={isCompleted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

