'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generate } from '@/lib/api';
import { motion } from 'framer-motion';
import { useProgress } from '@/lib/useProgress';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useLessonData, useLessonGeneration } from '@/lib/useLessonData';
import { LessonHeader } from '@/components/LessonHeader';
import { LessonContent } from '@/components/LessonContent';
import { LessonQuiz } from '@/components/LessonQuiz';
import { CourseSidebar } from '@/components/CourseSidebar';
import { LessonGenerationModal } from '@/components/LessonGenerationModal';
import AITeacherChat from '@/components/AITeacherChat';
import { BookOpen, Lightbulb, PenTool, Target, FileText, Bot, X } from 'lucide-react';

type TabType = 'theory' | 'example' | 'exercise' | 'quiz';

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-lg text-gray-700">Loading lesson...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  courseId: string;
  onBack: () => void;
}

function ErrorState({ error, courseId, onBack }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <X className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Lesson Not Found</h2>
        <p className="mb-6 text-gray-600">{error || 'The requested lesson could not be found'}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
        >
          Back to Course
        </button>
      </div>
    </div>
  );
}

function MobileSidebar({
  course,
  courseId,
  lessonId,
  expandedModules,
  isCompleted,
  onToggleModule,
  onNavigate,
  onClose,
}: {
  course: any;
  courseId: string;
  lessonId: string;
  expandedModules: Set<number>;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  onToggleModule: (moduleOrder: number) => void;
  onNavigate: (path: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 h-full w-72 z-50 lg:hidden transform transition-transform duration-300 translate-x-0">
        <div className="h-full overflow-y-auto p-6 bg-white border-r border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Course Details</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <CourseSidebar
            course={course}
            courseId={courseId}
            lessonId={lessonId}
            expandedModules={expandedModules}
            isCompleted={isCompleted}
            onToggleModule={onToggleModule}
            onNavigate={(path) => {
              onNavigate(path);
              onClose();
            }}
          />
        </div>
      </div>
    </>
  );
}

function LessonTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'example', label: 'Example', icon: Lightbulb },
    { id: 'exercise', label: 'Exercise', icon: PenTool },
    { id: 'quiz', label: 'Quiz', icon: Target },
  ];

  return (
    <div className="border-b border-gray-200 px-6">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyContentState({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="mb-4 flex justify-center">
        <FileText className="w-16 h-16 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Content Yet</h3>
      <p className="text-gray-600 mb-6">
        This lesson doesn't have content yet. Please go back to the course overview to generate
        content.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
      >
        Back to Course
      </button>
    </div>
  );
}

function AITutorButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.8 }}
        animate={{ opacity: 0, x: 20, scale: 0.8 }}
        whileHover={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl shadow-lg whitespace-nowrap pointer-events-none"
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
        className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
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
          <Bot className="w-8 h-8" />
        </motion.div>
      </motion.button>
    </div>
  );
}

function handleGenerateLessonContentHelper(
  course: any,
  lesson: any,
  module: any,
  refetch: () => Promise<void>,
  generationState: ReturnType<typeof useLessonGeneration>
) {
  const {
    setIsRegenerating,
    setLessonProgress,
    setIsCancelling,
    isCancelledRef,
    lessonAbortControllerRef,
    resetTimeoutRef,
    initialLessonProgress,
    lessonProgress,
  } = generationState;

  return async () => {
    if (!course || !lesson || !module) {
      return;
    }

    const previousEstimate = lesson.content?.estimatedMinutes ?? 4;
    const estimatedTimeRemaining = Math.min(5, Math.max(1, Math.ceil(previousEstimate * 0.3)));
    try {
      setIsRegenerating(true);
      setIsCancelling(false);
      isCancelledRef.current = false;
      const controller = new AbortController();
      lessonAbortControllerRef.current = controller;

      setLessonProgress({
        isGenerating: true,
        lessonTitle: lesson.title,
        currentStep: 'Generating lesson content...',
        percentage: 12,
        estimatedTimeRemaining,
      });

      await generate.content(
        {
          courseId: course._id,
          moduleOrder: module.order,
          lessonOrder: lesson.order,
          lessonId: lesson._id,
        },
        { signal: controller.signal }
      );

      if (isCancelledRef.current) {
        return;
      }

      setLessonProgress((prev) => ({
        ...prev,
        currentStep: 'Finalizing lesson...',
        percentage: Math.max(prev.percentage, 78),
        estimatedTimeRemaining: Math.max(1, Math.ceil(prev.estimatedTimeRemaining / 2)),
      }));

      await refetch();
      if (isCancelledRef.current) {
        return;
      }

      setLessonProgress((prev) => ({
        ...prev,
        currentStep: 'Lesson ready!',
        percentage: 100,
        estimatedTimeRemaining: 0,
      }));
    } catch (err: any) {
      if (
        err?.name === 'CanceledError' ||
        err?.code === 'ERR_CANCELED' ||
        err?.name === 'AbortError'
      ) {
        setLessonProgress((prev) => ({
          ...prev,
          currentStep: 'Cancelled',
          estimatedTimeRemaining: 0,
        }));
      }
    } finally {
      lessonAbortControllerRef.current = null;
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }

      if (!isCancelledRef.current || lessonProgress.currentStep === 'Lesson ready!') {
        resetTimeoutRef.current = setTimeout(() => setLessonProgress(initialLessonProgress), 400);
      }

      setIsRegenerating(false);
      if (!isCancelledRef.current) {
        setIsCancelling(false);
      }
    }
  };
}

function handleStopLessonGenerationHelper(
  generationState: ReturnType<typeof useLessonGeneration>
) {
  const {
    lessonProgress,
    isCancelling,
    setIsCancelling,
    isCancelledRef,
    lessonAbortControllerRef,
    setLessonProgress,
    setIsRegenerating,
    initialLessonProgress,
  } = generationState;

  return () => {
    if (!lessonProgress.isGenerating || isCancelling) {
      return;
    }

    setIsCancelling(true);
    isCancelledRef.current = true;
    lessonAbortControllerRef.current?.abort();

    setLessonProgress((prev) => ({
      ...prev,
      currentStep: 'Cancelled',
      percentage: 0,
      estimatedTimeRemaining: 0,
    }));

    setTimeout(() => {
      setLessonProgress(initialLessonProgress);
      setIsCancelling(false);
      setIsRegenerating(false);
    }, 1500);
  };
}

function useLessonGenerationHandlers(
  course: any,
  lesson: any,
  module: any,
  refetch: () => Promise<void>,
  generationState: ReturnType<typeof useLessonGeneration>
) {
  return {
    handleGenerateLessonContent: handleGenerateLessonContentHelper(
      course,
      lesson,
      module,
      refetch,
      generationState
    ),
    handleStopLessonGeneration: handleStopLessonGenerationHelper(generationState),
  };
}

function LessonPageContent({
  course,
  courseId,
  lessonId,
  lesson,
  module,
  hasContent,
  activeTab,
  onTabChange,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  expandedModules,
  isCompleted,
  onToggleModule,
  onNavigate,
  onBack,
}: {
  course: any;
  courseId: string;
  lessonId: string;
  lesson: any;
  module: any;
  hasContent: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  expandedModules: Set<number>;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  onToggleModule: (moduleOrder: number) => void;
  onNavigate: (path: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="lg:hidden flex items-center justify-end mb-6">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg transition-colors bg-white border border-gray-200 text-gray-900 hover:border-purple-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {isMobileSidebarOpen && (
        <MobileSidebar
          course={course}
          courseId={courseId}
          lessonId={lessonId}
          expandedModules={expandedModules}
          isCompleted={isCompleted}
          onToggleModule={onToggleModule}
          onNavigate={onNavigate}
          onClose={onToggleMobileSidebar}
        />
      )}

      {!hasContent ? (
        <EmptyContentState courseId={courseId} onBack={onBack} />
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <LessonTabs activeTab={activeTab} onTabChange={onTabChange} />
          <div className="p-8">
            {activeTab === 'quiz' && lesson.content ? (
              <LessonQuiz
                questions={lesson.content.quiz.questions}
                courseId={course?._id}
                lessonId={lesson._id?.toString()}
                moduleOrder={module?.order}
                lessonOrder={lesson.order}
              />
            ) : lesson.content ? (
              <LessonContent
                activeTab={activeTab}
                lessonContent={lesson.content}
                lessonTitle={lesson.title}
              />
            ) : null}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function useLessonPageState(courseId: string, lessonId: string) {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuthGuard();

  const { course, lesson, module, hasContent, loading, error, refetch } = useLessonData(
    courseId,
    lessonId
  );

  const totalLessons = course
    ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    : 0;
  const { progress: courseProgress, toggle: toggleProgress, isCompleted } = useProgress(
    courseId || '',
    totalLessons
  );

  const [activeTab, setActiveTab] = useState<TabType>('theory');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const generationState = useLessonGeneration();
  const { handleGenerateLessonContent, handleStopLessonGeneration } = useLessonGenerationHandlers(
    course,
    lesson,
    module,
    refetch,
    generationState
  );

  const toggleModule = (moduleOrder: number) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleOrder)) {
        newSet.delete(moduleOrder);
      } else {
        newSet.add(moduleOrder);
      }
      return newSet;
    });
  };

  return {
    router,
    course,
    lesson,
    module,
    hasContent,
    loading,
    error,
    authLoading,
    courseProgress,
    toggleProgress,
    isCompleted,
    activeTab,
    setActiveTab,
    isChatOpen,
    setIsChatOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    expandedModules,
    toggleModule,
    generationState,
    handleGenerateLessonContent,
    handleStopLessonGeneration,
  };
}

function LessonMainContent({
  course,
  courseId,
  lessonId,
  lesson,
  module,
  hasContent,
  activeTab,
  setActiveTab,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  expandedModules,
  isCompleted,
  toggleModule,
  router,
}: {
  course: any;
  courseId: string;
  lessonId: string;
  lesson: any;
  module: any;
  hasContent: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  expandedModules: Set<number>;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  toggleModule: (moduleOrder: number) => void;
  router: any;
}) {
  return (
    <div className="flex-1 min-w-0">
      <LessonPageContent
        course={course}
        courseId={courseId}
        lessonId={lessonId}
        lesson={lesson}
        module={module}
        hasContent={hasContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        expandedModules={expandedModules}
        isCompleted={isCompleted}
        onToggleModule={toggleModule}
        onNavigate={(path) => router.push(path)}
        onBack={() => router.push(`/course/${courseId}`)}
      />
    </div>
  );
}

function LessonPageLayout({
  course,
  courseId,
  lessonId,
  lesson,
  module,
  hasContent,
  activeTab,
  setActiveTab,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  expandedModules,
  isCompleted,
  toggleModule,
  generationState,
  courseProgress,
  toggleProgress,
  handleGenerateLessonContent,
  handleStopLessonGeneration,
  router,
}: {
  course: any;
  courseId: string;
  lessonId: string;
  lesson: any;
  module: any;
  hasContent: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  expandedModules: Set<number>;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  toggleModule: (moduleOrder: number) => void;
  generationState: ReturnType<typeof useLessonGeneration>;
  courseProgress: any;
  toggleProgress: (moduleOrder: number, lessonOrder: number, completed: boolean) => void;
  handleGenerateLessonContent: () => void;
  handleStopLessonGeneration: () => void;
  router: any;
}) {
  return (
    <div className="min-h-screen pt-20 bg-[#F8F8FC]">
      <div className="relative z-10 container mx-auto px-4 lg:px-6 py-12">
        <div className="flex gap-4">
          <div className="hidden lg:block w-72 flex-shrink-0">
            <CourseSidebar
              course={course}
              courseId={courseId}
              lessonId={lessonId}
              expandedModules={expandedModules}
              isCompleted={isCompleted}
              onToggleModule={toggleModule}
              onNavigate={(path) => router.push(path)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <LessonHeader
              lesson={lesson}
              module={module}
              hasContent={hasContent}
              isRegenerating={generationState.isRegenerating}
              isCompleted={isCompleted(module.order, lesson.order)}
              courseProgressSyncing={courseProgress.syncing}
              onGenerateLesson={handleGenerateLessonContent}
              onToggleComplete={() => {
                const completed = isCompleted(module.order, lesson.order);
                toggleProgress(module.order, lesson.order, !completed);
              }}
            />

            <LessonMainContent
              course={course}
              courseId={courseId}
              lessonId={lessonId}
              lesson={lesson}
              module={module}
              hasContent={hasContent}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isMobileSidebarOpen={isMobileSidebarOpen}
              setIsMobileSidebarOpen={setIsMobileSidebarOpen}
              expandedModules={expandedModules}
              isCompleted={isCompleted}
              toggleModule={toggleModule}
              router={router}
            />
          </div>
        </div>
      </div>

      <LessonGenerationModal
        progress={generationState.lessonProgress}
        lessonTitle={lesson.title}
        moduleOrder={module.order}
        lessonOrder={lesson.order}
        isCancelling={generationState.isCancelling}
        onStop={handleStopLessonGeneration}
      />
    </div>
  );
}

export default function LessonPage() {
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const {
    router,
    course,
    lesson,
    module,
    hasContent,
    loading,
    error,
    authLoading,
    courseProgress,
    toggleProgress,
    isCompleted,
    activeTab,
    setActiveTab,
    isChatOpen,
    setIsChatOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    expandedModules,
    toggleModule,
    generationState,
    handleGenerateLessonContent,
    handleStopLessonGeneration,
  } = useLessonPageState(courseId, lessonId);

  if (loading || authLoading) {
    return <LoadingState />;
  }

  if (error || !course || !lesson || !module) {
    return (
      <ErrorState
        error={error}
        courseId={courseId}
        onBack={() => router.push(`/course/${courseId}`)}
      />
    );
  }

  return (
    <>
      <LessonPageLayout
        course={course}
        courseId={courseId}
        lessonId={lessonId}
        lesson={lesson}
        module={module}
        hasContent={hasContent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        expandedModules={expandedModules}
        isCompleted={isCompleted}
        toggleModule={toggleModule}
        generationState={generationState}
        courseProgress={courseProgress}
        toggleProgress={toggleProgress}
        handleGenerateLessonContent={handleGenerateLessonContent}
        handleStopLessonGeneration={handleStopLessonGeneration}
        router={router}
      />

      <AITutorButton onOpen={() => setIsChatOpen(true)} />

      <AITeacherChat
        courseId={courseId}
        courseTitle={course.title}
        moduleTitle={module.title}
        lessonTitle={lesson.title}
        lessonContent={lesson.content?.theoryMd || ''}
        language={course.language}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
}
