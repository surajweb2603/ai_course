'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface LessonGenerationProgress {
  isGenerating: boolean;
  lessonTitle: string;
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining: number;
}

interface LessonGenerationModalProps {
  progress: LessonGenerationProgress;
  lessonTitle: string;
  moduleOrder: number;
  lessonOrder: number;
  isCancelling: boolean;
  onStop: () => void;
}

function ModalHeader({ lessonTitle }: { lessonTitle: string }) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
          <svg
            className="w-6 h-6 text-white animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white">Generating Lesson</h3>
          <p className="text-white/90 text-xs line-clamp-1 font-medium">{lessonTitle}</p>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center justify-center mb-3">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#lesson-progress)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="lesson-progress" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="50%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {percentage}%
          </span>
          <span className="text-xs text-gray-600 font-medium mt-1">Complete</span>
        </div>
      </div>
    </div>
  );
}

function StepInfo({
  currentStep,
  lessonTitle,
  moduleOrder,
  lessonOrder,
}: {
  currentStep: string;
  lessonTitle: string;
  moduleOrder: number;
  lessonOrder: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full animate-pulse mt-1 flex-shrink-0 shadow-lg shadow-purple-500/30" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-purple-600 font-semibold mb-1.5 uppercase tracking-wide">
            {currentStep || 'Preparing lesson...'}
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
            {lessonTitle}
          </h4>
          <p className="text-xs text-gray-600 font-medium">
            Module {moduleOrder} · Lesson {lessonOrder}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressStats({ estimatedTimeRemaining }: { estimatedTimeRemaining: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-xs text-gray-600 font-semibold">Lesson</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          1<span className="text-gray-400 text-base ml-1">/1</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-orange-50 rounded-lg">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-xs text-gray-600 font-semibold">Time Left</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          ~{Math.max(0, estimatedTimeRemaining)}
          <span className="text-gray-400 text-base ml-1">m</span>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 font-semibold">Overall Progress</span>
        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-full"
        />
      </div>
    </div>
  );
}

function ModalActions({
  isCancelling,
  currentStep,
  onStop,
}: {
  isCancelling: boolean;
  currentStep: string;
  onStop: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <div className="flex items-start gap-2 text-xs text-gray-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
        <svg
          className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium">Please don't close this window</span>
      </div>

      <motion.button
        onClick={onStop}
        type="button"
        disabled={
          isCancelling || currentStep === 'Lesson ready!' || currentStep === 'Cancelled'
        }
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm shadow-sm hover:shadow-md"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        {isCancelling ? 'Cancelling...' : 'Stop Generation'}
      </motion.button>
    </div>
  );
}

export function LessonGenerationModal({
  progress,
  lessonTitle,
  moduleOrder,
  lessonOrder,
  isCancelling,
  onStop,
}: LessonGenerationModalProps) {
  if (!progress.isGenerating) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          style={{ margin: 0 }}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
            className="w-full"
            style={{ maxWidth: '28rem' }}
          >
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
              <ModalHeader lessonTitle={progress.lessonTitle} />

              <div className="p-6 space-y-5 bg-white">
                <CircularProgress percentage={progress.percentage} />
                <StepInfo
                  currentStep={progress.currentStep}
                  lessonTitle={lessonTitle}
                  moduleOrder={moduleOrder}
                  lessonOrder={lessonOrder}
                />
                <ProgressStats estimatedTimeRemaining={progress.estimatedTimeRemaining} />
                <ProgressBar percentage={progress.percentage} />
                <ModalActions
                  isCancelling={isCancelling}
                  currentStep={progress.currentStep}
                  onStop={onStop}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}


