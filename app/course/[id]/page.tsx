'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { courses, generate, certificate } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AITeacherChat from '@/components/AITeacherChat';
import { useProgress } from '@/lib/useProgress';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { Bot } from 'lucide-react';

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
  lessons: Lesson[];
}

interface Course {
  _id: string;
  userId: string;
  title: string;
  language: string;
  summary?: string;
  tags?: string[];
  visibility: 'private' | 'unlisted' | 'public';
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

interface GenerationProgress {
  isGenerating: boolean;
  courseName: string;
  currentStep: string;
  currentModule: string;
  currentModuleNumber: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  estimatedTimeRemaining: number;
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-lg text-gray-700">Loading course...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onBack: () => void;
}

function ErrorState({ error, onBack }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Error Loading Course</h2>
        <p className="mb-6 text-gray-600">{error || 'Course not found'}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function LessonList({
  lessons,
  moduleOrder,
  courseId,
  isCompleted,
  toggleProgress,
  courseProgress,
  router,
}: {
  lessons: Lesson[];
  moduleOrder: number;
  courseId: string;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  toggleProgress: (moduleOrder: number, lessonOrder: number, completed: boolean) => void;
  courseProgress: { syncing: boolean };
  router: any;
}) {
  return (
    <div className="space-y-1 mb-6 max-h-48 overflow-y-auto">
      {lessons
        .sort((a, b) => a.order - b.order)
        .map((lesson) => {
          const lessonCompleted = isCompleted(moduleOrder, lesson.order);

          return (
            <div
              key={lesson._id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all group/lesson ${
                lessonCompleted
                  ? 'bg-green-50 border border-green-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-gray-600 flex-shrink-0 w-4">{lesson.order}.</span>
                <button
                  onClick={() => {
                    router.push(`/course/${courseId}/lesson/${lesson._id}`);
                  }}
                  className={`text-sm transition-colors truncate text-left flex-1 ${
                    lessonCompleted
                      ? 'text-green-700 group-hover/lesson:text-green-600'
                      : 'text-gray-700 group-hover/lesson:text-purple-600'
                  }`}
                  title={lesson.title}
                >
                  {lesson.title}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {lesson.content && <span className="text-green-600 text-xs">✓</span>}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProgress(moduleOrder, lesson.order, !lessonCompleted);
                  }}
                  className={`p-1 rounded transition-all ${
                    lessonCompleted
                      ? 'text-green-600 hover:text-green-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={lessonCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {courseProgress.syncing ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill={lessonCompleted ? 'currentColor' : 'none'}
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
                  )}
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function ModuleCard({
  module,
  courseId,
  isCompleted,
  toggleProgress,
  courseProgress,
  router,
}: {
  module: Module;
  courseId: string;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  toggleProgress: (moduleOrder: number, lessonOrder: number, completed: boolean) => void;
  courseProgress: { syncing: boolean };
  router: any;
}) {
  const completedLessons = module.lessons.filter((lesson) =>
    isCompleted(module.order, lesson.order)
  ).length;
  const progressPercent =
    module.lessons.length > 0 ? (completedLessons / module.lessons.length) * 100 : 0;

  return (
    <motion.div
      key={module._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * module.order }}
      className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group relative overflow-hidden shadow-sm"
    >
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <span className="text-white font-bold text-base sm:text-lg">{module.order}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2 break-words"
            title={module.title}
          >
            {module.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <span>
              {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
            </span>
            <span>•</span>
            <span className="text-purple-600 font-medium">{Math.round(progressPercent)}% complete</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-full"
          />
        </div>
      </div>

      <LessonList
        lessons={module.lessons}
        moduleOrder={module.order}
        courseId={courseId}
        isCompleted={isCompleted}
        toggleProgress={toggleProgress}
        courseProgress={courseProgress}
        router={router}
      />

      <div className="flex gap-2">
        <button
          onClick={() => {
            const firstLesson = module.lessons.sort((a, b) => a.order - b.order)[0];
            if (firstLesson) {
              router.push(`/course/${courseId}/lesson/${firstLesson._id}`);
            }
          }}
          className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-100 text-purple-600 font-semibold rounded-lg hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
            />
          </svg>
          {progressPercent === 100 ? 'Review Module' : 'Start Module'}
        </button>
      </div>
    </motion.div>
  );
}

function useCourseData(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await courses.getById(courseId);
        setCourse(response.course);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const refetch = async () => {
    if (!courseId) return;
    try {
      const response = await courses.getById(courseId);
      setCourse(response.course);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load course');
    }
  };

  return { course, loading, error, refetch, setCourse };
}

interface CourseHeaderInfoProps {
  course: Course;
  courseProgress: { percent: number };
  courseId: string;
  userPlan?: string;
}

function CertificateSection({ courseId, userPlan }: { courseId: string; userPlan?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      {userPlan !== 'free' ? (
        <button
          onClick={async () => {
            try {
              const blob = await certificate.download(courseId);
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `certificate-${courseId}.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error: any) {
              const errorMessage = error.message || 'Failed to download certificate';
              alert(errorMessage);
            }
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Certificate
          <span className="hidden sm:inline text-xs bg-white/20 px-2 py-0.5 rounded-full">
            Includes QR and verification link
          </span>
        </button>
      ) : (
        <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-2xl"></div>
          </div>
          
          {/* Lock icon with premium styling */}
          <div className="relative flex-shrink-0">
            <motion.div 
              className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </motion.div>
          </div>
          
          {/* Text content */}
          <div className="flex-1 relative z-10 min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              Certificate download available for paid plans
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Unlock premium features and get your completion certificate
            </p>
          </div>
          
          {/* Upgrade button */}
          <a
            href="/pricing"
            className="relative z-10 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            Upgrade Now
          </a>
        </div>
      )}
    </motion.div>
  );
}

function CourseHeaderInfo({ course, courseProgress, courseId, userPlan }: CourseHeaderInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 break-words">{course.title}</h1>
      {course.summary && <p className="mb-3 text-gray-600 text-sm sm:text-base break-words">{course.summary}</p>}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
          {course.language.toUpperCase()}
        </span>
        <span className="text-xs sm:text-sm text-gray-600">
          {course.modules.length} modules ·{' '}
          {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-600">Course Progress</span>
          <span className="font-semibold text-purple-600">{courseProgress.percent}%</span>
        </div>
        <div className="w-full rounded-full h-2 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${courseProgress.percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-700"
          />
        </div>
      </div>

      {courseProgress.percent === 100 && <CertificateSection courseId={courseId} userPlan={userPlan} />}
    </div>
  );
}

interface CourseHeaderActionsProps {
  course: Course;
  onShare: () => void;
  onExport: () => void;
  isExporting: boolean;
  onGenerateFullCourse: () => void;
  isRegenerating: boolean;
  isFullCourseGenerated: boolean;
  userPlan?: string;
}

function CourseHeaderActions({
  course,
  onShare,
  onExport,
  isExporting,
  onGenerateFullCourse,
  isRegenerating,
  isFullCourseGenerated,
  userPlan,
}: CourseHeaderActionsProps) {
  return (
    <div className="flex flex-col gap-3 w-full md:w-auto">
      <button
        onClick={onShare}
        className="w-full md:w-auto px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
        Share Course
      </button>

      <button
        onClick={onExport}
        disabled={isExporting || !course?.modules?.length}
        className="w-full md:w-auto px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export Course
          </>
        )}
      </button>

      {!isFullCourseGenerated && userPlan !== 'free' && (
        <button
          onClick={onGenerateFullCourse}
          disabled={isRegenerating}
          className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              Generate Full Course
            </>
          )}
        </button>
      )}
    </div>
  );
}

interface CourseHeaderProps {
  course: Course;
  courseProgress: { percent: number };
  courseId: string;
  onShare: () => void;
  onExport: () => void;
  isExporting: boolean;
  onGenerateFullCourse: () => void;
  isRegenerating: boolean;
  isFullCourseGenerated: boolean;
  userPlan?: string;
}

function CourseHeader({
  course,
  courseProgress,
  courseId,
  onShare,
  onExport,
  isExporting,
  onGenerateFullCourse,
  isRegenerating,
  isFullCourseGenerated,
  userPlan,
}: CourseHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
        <CourseHeaderInfo course={course} courseProgress={courseProgress} courseId={courseId} userPlan={userPlan} />
        <CourseHeaderActions
          course={course}
          onShare={onShare}
          onExport={onExport}
          isExporting={isExporting}
          onGenerateFullCourse={onGenerateFullCourse}
          isRegenerating={isRegenerating}
          isFullCourseGenerated={isFullCourseGenerated}
          userPlan={userPlan}
        />
      </div>
    </motion.div>
  );
}

interface GenerationProgressHeaderProps {
  courseName: string;
}

function GenerationProgressHeader({ courseName }: GenerationProgressHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
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
          <div>
            <h3 className="text-lg font-bold text-white">Generating Full Course</h3>
            <p className="text-white/90 text-xs line-clamp-1">{courseName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CircularProgressIndicatorProps {
  percentage: number;
}

function CircularProgressIndicator({ percentage }: CircularProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-2">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {percentage}%
          </span>
          <span className="text-xs text-gray-600 font-medium">Complete</span>
        </div>
      </div>
    </div>
  );
}

interface CurrentStepInfoProps {
  currentStep: string;
  currentModule: string;
  currentModuleNumber: number;
  totalModules: number;
}

function CurrentStepInfo({
  currentStep,
  currentModule,
  currentModuleNumber,
  totalModules,
}: CurrentStepInfoProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full animate-pulse mt-1.5 flex-shrink-0 shadow-lg shadow-purple-500/30" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-purple-600 font-semibold mb-0.5 uppercase tracking-wide">
            {currentStep}
          </div>
          {currentModule && (
            <>
              <h4 className="text-base font-bold text-gray-900 mb-0.5 line-clamp-2">
                {currentModule}
              </h4>
              <p className="text-xs text-gray-600 font-medium">
                Module {currentModuleNumber} of {totalModules}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProgressStatsProps {
  completedLessons: number;
  totalLessons: number;
  estimatedTimeRemaining: number;
}

function ProgressStats({
  completedLessons,
  totalLessons,
  estimatedTimeRemaining,
}: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-1.5 mb-1">
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
          <span className="text-xs text-gray-600 font-semibold">Lessons</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {completedLessons}
          <span className="text-gray-400">/{totalLessons}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-1.5 mb-1">
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
          ~{estimatedTimeRemaining}
          <span className="text-gray-400 text-base">m</span>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  percentage: number;
}

function ProgressBar({ percentage }: ProgressBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
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

interface ProgressActionsProps {
  onStop: () => void;
  isCancelling: boolean;
  currentStep: string;
}

function ProgressActions({ onStop, isCancelling, currentStep }: ProgressActionsProps) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
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

      <button
        onClick={onStop}
        type="button"
        disabled={isCancelling || currentStep === 'Saving...' || currentStep === 'Cancelled'}
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
      </button>
    </div>
  );
}

interface GenerationProgressModalProps {
  progress: GenerationProgress;
  onStop: () => void;
  isCancelling: boolean;
}

function GenerationProgressModal({
  progress,
  onStop,
  isCancelling,
}: GenerationProgressModalProps) {
  return (
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
          transition={{ duration: 0.2 }}
          className="w-full"
          style={{ maxWidth: '31.5rem' }}
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            <GenerationProgressHeader courseName={progress.courseName} />

            <div className="p-5 space-y-4 bg-white">
              <CircularProgressIndicator percentage={progress.percentage} />
              <CurrentStepInfo
                currentStep={progress.currentStep}
                currentModule={progress.currentModule}
                currentModuleNumber={progress.currentModuleNumber}
                totalModules={progress.totalModules}
              />
              <ProgressStats
                completedLessons={progress.completedLessons}
                totalLessons={progress.totalLessons}
                estimatedTimeRemaining={progress.estimatedTimeRemaining}
              />
              <ProgressBar percentage={progress.percentage} />
              <ProgressActions
                onStop={onStop}
                isCancelling={isCancelling}
                currentStep={progress.currentStep}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

interface ShareModalHeaderProps {
  courseTitle: string;
  onClose: () => void;
}

function ShareModalHeader({ courseTitle, onClose }: ShareModalHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share Course</h3>
            <p className="text-purple-100 text-sm">{courseTitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface VisibilitySelectorProps {
  visibility: 'private' | 'unlisted' | 'public';
  isUpdating: boolean;
  onUpdate: (visibility: 'private' | 'unlisted' | 'public') => void;
}

function VisibilitySelector({ visibility, isUpdating, onUpdate }: VisibilitySelectorProps) {
  return (
    <div className="grid gap-3">
      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
        <input
          type="radio"
          name="visibility"
          value="public"
          checked={visibility === 'public'}
          onChange={() => onUpdate('public')}
          disabled={isUpdating}
          className="text-purple-600"
        />
        <div>
          <div className="text-gray-900 font-medium">Public</div>
          <div className="text-xs text-gray-600">Discoverable and shareable</div>
        </div>
      </label>
    </div>
  );
}

interface ShareLinkSectionProps {
  shareUrl: string;
  onCopy: () => void;
}

function ShareLinkSection({ shareUrl, onCopy }: ShareLinkSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <button
          onClick={onCopy}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </button>
      </div>
    </div>
  );
}

interface SocialSharingButtonsProps {
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
}

function SocialSharingButtons({ onShareWhatsApp, onShareEmail }: SocialSharingButtonsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Share via</label>
      <div className="flex gap-3">
        <button
          onClick={onShareWhatsApp}
          className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
          WhatsApp
        </button>

        <button
          onClick={onShareEmail}
          className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Email
        </button>
      </div>
    </div>
  );
}

interface ShareModalProps {
  course: Course;
  shareUrl: string;
  isOpen: boolean;
  isUpdatingVisibility: boolean;
  onClose: () => void;
  onUpdateVisibility: (visibility: 'private' | 'unlisted' | 'public') => void;
  onCopy: () => void;
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
}

function ShareModal({
  course,
  shareUrl,
  isOpen,
  isUpdatingVisibility,
  onClose,
  onUpdateVisibility,
  onCopy,
  onShareWhatsApp,
  onShareEmail,
}: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <ShareModalHeader courseTitle={course?.title} onClose={onClose} />

          <div className="p-6 space-y-4 bg-white">
            <VisibilitySelector
              visibility={course?.visibility || 'private'}
              isUpdating={isUpdatingVisibility}
              onUpdate={onUpdateVisibility}
            />

            {course?.visibility !== 'private' && (
              <>
                <ShareLinkSection shareUrl={shareUrl} onCopy={onCopy} />
                <SocialSharingButtons
                  onShareWhatsApp={onShareWhatsApp}
                  onShareEmail={onShareEmail}
                />
              </>
            )}

            {isUpdatingVisibility && (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="ml-2 text-gray-400">Updating visibility...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

interface AITutorButtonProps {
  onOpen: () => void;
}

function AITutorButton({ onOpen }: AITutorButtonProps) {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group">
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.8 }}
        animate={{ opacity: 0, x: 20, scale: 0.8 }}
        whileHover={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="hidden md:block absolute right-20 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl shadow-lg whitespace-nowrap pointer-events-none"
      >
        <div className="text-sm font-bold mb-1 flex items-center gap-2 text-gray-900">
          <Bot className="w-4 h-4 text-purple-600" /> AI Tutor
        </div>
        <div className="text-xs text-gray-600 font-medium">
          Hey! I'm your AI tutor. Ask me anything or if you have doubts, I'm here to help!
        </div>
        <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 w-0 h-0 border-l-8 border-l-white border-t-4 border-b-4 border-t-transparent border-b-transparent"></div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow: [
            '0 10px 25px rgba(147, 51, 234, 0.3)',
            '0 10px 25px rgba(147, 51, 234, 0.5)',
            '0 10px 25px rgba(147, 51, 234, 0.3)',
          ],
        }}
        whileHover={{
          scale: 1.1,
          boxShadow: '0 15px 35px rgba(147, 51, 234, 0.6)',
        }}
        whileTap={{ scale: 0.9 }}
        transition={{
          scale: { duration: 0.2 },
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        onClick={onOpen}
        className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full border-2 border-white/30"
        />

        <motion.div
          className="relative z-10"
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{
            scale: 1.2,
            rotate: [0, -10, 10, 0],
          }}
        >
          <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
        </motion.div>
      </motion.button>
    </div>
  );
}

function createInitialProgress(
  courseTitle: string,
  totalModules: number,
  totalLessons: number,
  estimatedTotalMinutes: number
): GenerationProgress {
  return {
    isGenerating: true,
    courseName: courseTitle,
    currentStep: 'Initializing...',
    currentModule: '',
    currentModuleNumber: 0,
    totalModules,
    completedLessons: 0,
    totalLessons,
    percentage: 0,
    estimatedTimeRemaining: estimatedTotalMinutes,
  };
}

function createEmptyProgress(): GenerationProgress {
  return {
    isGenerating: false,
    courseName: '',
    currentStep: '',
    currentModule: '',
    currentModuleNumber: 0,
    totalModules: 0,
    completedLessons: 0,
    totalLessons: 0,
    percentage: 0,
    estimatedTimeRemaining: 0,
  };
}

function updateProgressForModule(
  courseTitle: string,
  module: Module,
  moduleIndex: number,
  totalModules: number,
  totalLessons: number,
  successCount: number,
  minutesPerLesson: number
): GenerationProgress {
  const lessonsRemaining = totalLessons - successCount;
  const estimatedTimeRemaining = Math.max(1, Math.ceil(lessonsRemaining * minutesPerLesson));

  return {
    isGenerating: true,
    courseName: courseTitle,
    currentStep: 'Generating Content',
    currentModule: module.title,
    currentModuleNumber: moduleIndex + 1,
    totalModules,
    completedLessons: successCount,
    totalLessons,
    percentage: Math.round((successCount / totalLessons) * 100),
    estimatedTimeRemaining,
  };
}

function updateProgressAfterModule(
  courseTitle: string,
  module: Module,
  moduleIndex: number,
  totalModules: number,
  totalLessons: number,
  newSuccessCount: number,
  minutesPerLesson: number
): GenerationProgress {
  return {
    isGenerating: true,
    courseName: courseTitle,
    currentStep: 'Generating Content',
    currentModule: module.title,
    currentModuleNumber: moduleIndex + 1,
    totalModules,
    completedLessons: newSuccessCount,
    totalLessons,
    percentage: Math.round((newSuccessCount / totalLessons) * 100),
    estimatedTimeRemaining: Math.max(0, Math.ceil((totalLessons - newSuccessCount) * minutesPerLesson)),
  };
}

function useGenerationState() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>(
    createEmptyProgress()
  );
  const isCancelledRef = useRef(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  return {
    isRegenerating,
    setIsRegenerating,
    generationProgress,
    setGenerationProgress,
    isCancelledRef,
    isCancelled,
    setIsCancelled,
    isCancelling,
    setIsCancelling,
  };
}

function generateModuleContentHelper(
  course: Course,
  module: Module,
  moduleIndex: number,
  totalModules: number,
  totalLessons: number,
  successCount: number,
  minutesPerLesson: number,
  setGenerationProgress: React.Dispatch<React.SetStateAction<GenerationProgress>>,
  isCancelledRef: React.MutableRefObject<boolean>
): Promise<{ success: boolean; lessonCount: number }> {
  if (isCancelledRef.current) {
    return Promise.resolve({ success: false, lessonCount: 0 });
  }

  setGenerationProgress(
    updateProgressForModule(
      course.title,
      module,
      moduleIndex,
      totalModules,
      totalLessons,
      successCount,
      minutesPerLesson
    )
  );

  return generate.content({
    courseId: course._id,
    moduleOrder: module.order,
  })
    .then(() => {
      const newSuccessCount = successCount + module.lessons.length;
      setGenerationProgress(
        updateProgressAfterModule(
          course.title,
          module,
          moduleIndex,
          totalModules,
          totalLessons,
          newSuccessCount,
          minutesPerLesson
        )
      );
      return { success: true, lessonCount: module.lessons.length };
    })
    .catch(() => {
      return { success: false, lessonCount: module.lessons.length };
    });
}

function processGenerationLoopHelper(
  course: Course,
  sortedModules: Module[],
  totalModules: number,
  totalLessons: number,
  minutesPerLesson: number,
  setGenerationProgress: React.Dispatch<React.SetStateAction<GenerationProgress>>,
  isCancelledRef: React.MutableRefObject<boolean>
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;

  const processNext = async (index: number): Promise<void> => {
    if (index >= sortedModules.length || isCancelledRef.current) {
      if (isCancelledRef.current) {
        setGenerationProgress((prev) => ({
          ...prev,
          currentStep: 'Cancelled',
        }));
      }
      return;
    }

    const result = await generateModuleContentHelper(
      course,
      sortedModules[index],
      index,
      totalModules,
      totalLessons,
      successCount,
      minutesPerLesson,
      setGenerationProgress,
      isCancelledRef
    );

    if (result.success) {
      successCount += result.lessonCount;
    } else {
      failCount += result.lessonCount;
    }

    await processNext(index + 1);
  };

  return processNext(0).then(() => ({ successCount, failCount }));
}

function useCourseGeneration(
  course: Course | null,
  user: any,
  refetch: () => Promise<void>
) {
  const {
    isRegenerating,
    setIsRegenerating,
    generationProgress,
    setGenerationProgress,
    isCancelledRef,
    isCancelled,
    setIsCancelled,
    isCancelling,
    setIsCancelling,
  } = useGenerationState();

  const handleGenerateFullCourse = async () => {
    if (!course) return;

    if (user?.plan === 'free' && course.modules.length >= 2) {
      window.location.href = '/pricing';
      return;
    }

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const totalModules = course.modules.length;
    const minutesPerLesson = 0.15;
    const estimatedTotalMinutes = Math.max(1, Math.ceil(totalLessons * minutesPerLesson));

    try {
      setIsRegenerating(true);
      setIsCancelled(false);
      setIsCancelling(false);
      isCancelledRef.current = false;

      setGenerationProgress(
        createInitialProgress(course.title, totalModules, totalLessons, estimatedTotalMinutes)
      );

      const sortedModules = course.modules.sort((a, b) => a.order - b.order);
      await processGenerationLoopHelper(
        course,
        sortedModules,
        totalModules,
        totalLessons,
        minutesPerLesson,
        setGenerationProgress,
        isCancelledRef
      );

      if (!isCancelledRef.current) {
        setGenerationProgress((prev) => ({
          ...prev,
          currentStep: 'Saving...',
          percentage: 100,
        }));
        await refetch();
      }

      if (!isCancelledRef.current) {
        setGenerationProgress(createEmptyProgress());
        setIsCancelling(false);
      }
    } catch (err: any) {
      setGenerationProgress(createEmptyProgress());
    } finally {
      if (!isCancelledRef.current) {
        setIsRegenerating(false);
        setIsCancelled(false);
        setIsCancelling(false);
      }
    }
  };

  const handleStopGeneration = () => {
    if (isCancelling) {
      return;
    }

    isCancelledRef.current = true;
    setIsCancelled(true);
    setIsCancelling(true);

    setGenerationProgress((prev) => ({
      ...prev,
      currentStep: 'Cancelled',
    }));

    setTimeout(() => {
      setGenerationProgress(createEmptyProgress());
      setIsCancelling(false);
      setIsCancelled(false);
      setIsRegenerating(false);
    }, 1500);
  };

  return {
    isRegenerating,
    generationProgress,
    isCancelling,
    handleGenerateFullCourse,
    handleStopGeneration,
  };
}

function useCourseSharing(courseId: string, course: Course | null) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const handleShareCourse = () => {
    if (!course) return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/share/${courseId}`;
    setShareUrl(url);
    setIsShareModalOpen(true);
  };

  const handleUpdateVisibility = async (visibility: 'private' | 'unlisted' | 'public') => {
    if (!course) return;

    try {
      setIsUpdatingVisibility(true);
      await courses.updateVisibility(courseId, visibility);

      if (visibility !== 'private') {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/share/${courseId}`;
        setShareUrl(url);
      }
    } catch (err: any) {
      // Handle error
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Check out this course: ${course?.title}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Check out this course: ${course?.title}`;
    const body = `I found this interesting course and thought you might like it:\n\n${shareUrl}\n\nCourse: ${course?.title}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return {
    isShareModalOpen,
    shareUrl,
    isUpdatingVisibility,
    setIsShareModalOpen,
    handleShareCourse,
    handleUpdateVisibility,
    copyToClipboard,
    shareViaWhatsApp,
    shareViaEmail,
  };
}

function useCourseExport(course: Course | null, courseId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExportCourse = async () => {
    if (!course) return;

    try {
      setIsExporting(true);
      const blob = await courses.export(courseId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export course');
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, error, handleExportCourse };
}

function CourseModulesGrid({
  modules,
  courseId,
  isCompleted,
  toggleProgress,
  courseProgress,
  router,
}: {
  modules: Module[];
  courseId: string;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  toggleProgress: (moduleOrder: number, lessonOrder: number, completed: boolean) => void;
  courseProgress: { syncing: boolean };
  router: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {modules
        .sort((a, b) => a.order - b.order)
        .map((module) => (
          <ModuleCard
            key={module._id}
            module={module}
            courseId={courseId}
            isCompleted={isCompleted}
            toggleProgress={toggleProgress}
            courseProgress={courseProgress}
            router={router}
          />
        ))}
    </motion.div>
  );
}

function CourseModals({
  generationProgress,
  isCancelling,
  onStopGeneration,
  isShareModalOpen,
  course,
  shareUrl,
  isUpdatingVisibility,
  onCloseShareModal,
  onUpdateVisibility,
  onCopy,
  onShareWhatsApp,
  onShareEmail,
  setCourse,
}: {
  generationProgress: GenerationProgress;
  isCancelling: boolean;
  onStopGeneration: () => void;
  isShareModalOpen: boolean;
  course: Course;
  shareUrl: string;
  isUpdatingVisibility: boolean;
  onCloseShareModal: () => void;
  onUpdateVisibility: (visibility: 'private' | 'unlisted' | 'public') => Promise<void>;
  onCopy: () => void;
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
  setCourse: (course: Course) => void;
}) {
  return (
    <>
      <AnimatePresence>
        {generationProgress.isGenerating && (
          <GenerationProgressModal
            progress={generationProgress}
            onStop={onStopGeneration}
            isCancelling={isCancelling}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareModalOpen && (
          <ShareModal
            course={course}
            shareUrl={shareUrl}
            isOpen={isShareModalOpen}
            isUpdatingVisibility={isUpdatingVisibility}
            onClose={onCloseShareModal}
            onUpdateVisibility={async (visibility) => {
              await onUpdateVisibility(visibility);
              setCourse({ ...course, visibility });
            }}
            onCopy={onCopy}
            onShareWhatsApp={onShareWhatsApp}
            onShareEmail={onShareEmail}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CoursePageContent({
  course,
  courseProgress,
  courseId,
  onShare,
  onExport,
  isExporting,
  onGenerateFullCourse,
  isRegenerating,
  isFullCourseGenerated,
  modules,
  isCompleted,
  toggleProgress,
  router,
  userPlan,
}: {
  course: Course;
  courseProgress: { percent: number };
  courseId: string;
  onShare: () => void;
  onExport: () => void;
  isExporting: boolean;
  onGenerateFullCourse: () => void;
  isRegenerating: boolean;
  isFullCourseGenerated: boolean;
  modules: Module[];
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  toggleProgress: (moduleOrder: number, lessonOrder: number, completed: boolean) => void;
  router: any;
  userPlan?: string;
}) {
  return (
    <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-purple-600 transition-colors mb-6 sm:mb-8"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Dashboard
      </motion.button>

      <CourseHeader
        course={course}
        courseProgress={courseProgress}
        courseId={courseId}
        onShare={onShare}
        onExport={onExport}
        isExporting={isExporting}
        onGenerateFullCourse={onGenerateFullCourse}
        isRegenerating={isRegenerating}
        isFullCourseGenerated={isFullCourseGenerated}
        userPlan={userPlan}
      />

      <CourseModulesGrid
        modules={modules}
        courseId={courseId}
        isCompleted={isCompleted}
        toggleProgress={toggleProgress}
        courseProgress={{ syncing: false }}
        router={router}
      />
    </div>
  );
}

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuthGuard();

  const { course, loading, error, refetch, setCourse } = useCourseData(id);

  const totalLessons = course
    ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    : 0;
  const { progress: courseProgress, toggle: toggleProgress, isCompleted } = useProgress(
    id || '',
    totalLessons
  );

  const [isChatOpen, setIsChatOpen] = useState(false);

  const { isRegenerating, generationProgress, isCancelling, handleGenerateFullCourse, handleStopGeneration } =
    useCourseGeneration(course, user, refetch);

  const {
    isShareModalOpen,
    shareUrl,
    isUpdatingVisibility,
    setIsShareModalOpen,
    handleShareCourse,
    handleUpdateVisibility,
    copyToClipboard,
    shareViaWhatsApp,
    shareViaEmail,
  } = useCourseSharing(id, course);

  const { isExporting, handleExportCourse } = useCourseExport(course, id);

  const isFullCourseGenerated = () => {
    if (!course) return false;
    return course.modules.every((module) => module.lessons.every((lesson) => lesson.content));
  };

  if (loading || authLoading) {
    return <LoadingState />;
  }

  if (error || !course) {
    return <ErrorState error={error} onBack={() => router.push('/dashboard')} />;
  }

  return (
    <div className="min-h-screen pt-20 bg-[#F8F8FC]">
      <CoursePageContent
        course={course}
        courseProgress={courseProgress}
        courseId={id}
        onShare={handleShareCourse}
        onExport={handleExportCourse}
        isExporting={isExporting}
        onGenerateFullCourse={handleGenerateFullCourse}
        isRegenerating={isRegenerating}
        isFullCourseGenerated={isFullCourseGenerated()}
        modules={course.modules}
        isCompleted={isCompleted}
        toggleProgress={toggleProgress}
        router={router}
        userPlan={user?.plan}
      />

      <CourseModals
        generationProgress={generationProgress}
        isCancelling={isCancelling}
        onStopGeneration={handleStopGeneration}
        isShareModalOpen={isShareModalOpen}
        course={course}
        shareUrl={shareUrl}
        isUpdatingVisibility={isUpdatingVisibility}
        onCloseShareModal={() => setIsShareModalOpen(false)}
        onUpdateVisibility={handleUpdateVisibility}
        onCopy={copyToClipboard}
        onShareWhatsApp={shareViaWhatsApp}
        onShareEmail={shareViaEmail}
        setCourse={setCourse}
      />

      <AITutorButton onOpen={() => setIsChatOpen(true)} />

      <AITeacherChat
        courseId={id}
        courseTitle={course.title}
        moduleTitle="Course Overview"
        lessonTitle="General Course Questions"
        lessonContent=""
        language={course.language}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
