'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { courses, generate, imageSearch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownView from '@/components/MarkdownView';
import QuizBlock from '@/components/QuizBlock';
import VideoEmbed from '@/components/VideoEmbed';
import AITeacherChat from '@/components/AITeacherChat';
import { useProgress } from '@/lib/useProgress';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { Lightbulb, PenTool, Target, Video, BookOpen, Clock, FileText, Key, Image, Bot, X, RefreshCw, GraduationCap } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url?: string | null;
  alt?: string;
  prompt?: string | null;
  title?: string;
}

interface QuizQuestion {
  stem: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

interface LessonContent {
  theoryMd: string;
  exampleMd: string;
  exerciseMd: string;
  keyTakeaways: string[];
  media?: MediaItem[];
  quiz: {
    questions: QuizQuestion[];
  };
  estimatedMinutes?: number;
}

interface Lesson {
  _id: string;
  order: number;
  title: string;
  summary?: string;
  content?: LessonContent;
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

type TabType = 'theory' | 'example' | 'exercise' | 'quiz';

interface LessonGenerationProgress {
  isGenerating: boolean;
  lessonTitle: string;
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining: number;
}

// Image display component with error handling
function ImageDisplayItem({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check if URL is a Bing proxy URL (likely to fail)
  const isProxyUrl = item.url?.includes('r.bing.com/rp/') || false;

  const handleImageError = () => {
    const currentUrl = retryUrl || item.url;
    setImageError(true);
    setImageLoading(false);
    // Don't clear retryUrl - keep it so user can see what was tried
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Initialize: Check if URL is null/invalid from the start
  // Reset state when retryUrl changes (new image found)
  useEffect(() => {
    const url = retryUrl || item.url;
    
    if (!url || url === 'null' || url.trim() === '') {
      setImageError(true);
      setImageLoading(false);
    } else {
      // Reset error state if we have a valid URL
      setImageError(false);
      setImageLoading(true);
    }
  }, [item.url, retryUrl]); // React to both item.url and retryUrl changes

  const handleRetry = async () => {
    if (!item.prompt) return;
    
    setRetrying(true);
    setImageError(false);
    setImageLoading(true);
    setErrorMessage(null); // Clear previous error messages
    
    // Note: We don't clear retryUrl here - we'll replace it with the new URL when found
    // This prevents the image from briefly showing the original failed URL

    const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;
    const HIGH_CONFIDENCE_HOST_REGEX = /(mm\.bing\.net|googleusercontent\.com|gstatic\.com|wikimedia\.org|staticflickr\.com|imgur\.com|unsplash\.com|pexels\.com|cloudfront\.net|blogspot\.com|wordpress\.com|nitrocdn\.com)/i;
    const PROXY_HOST_REGEX = /r\.bing\.com\/rp\//i;

    const normalizeUrl = (candidate: unknown): string | null => {
      if (!candidate || typeof candidate !== 'string') {
        return null;
      }
      const trimmed = candidate.trim();
      if (!trimmed || trimmed === 'null') {
        return null;
      }
      if (!/^https?:\/\//i.test(trimmed)) {
        return null;
      }
      return trimmed;
    };

    const computeCandidateScore = (url: string, baseScore: number) => {
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
    };

    // Collect every URL-looking string from the search result and score them by how "image-like" they appear.
    const extractCandidateUrls = (rawResult: any, index: number): Array<{ url: string; score: number }> => {
      const urls: string[] = [];
      const visited = new Set<object>();

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
    };

    // Try to load the image in the background so we only surface URLs that actually respond with image bytes.
    const preloadImage = (url: string) =>
      new Promise<void>((resolve, reject) => {
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
    
    try {
      const result = await imageSearch.search({ 
        query: item.prompt, 
        numResults: 5 
      });
      
      
      if (result.success && Array.isArray(result.results) && result.results.length > 0) {
        const candidateScores = new Map<string, number>();
        
        result.results.forEach((rawResult: any, index: number) => {
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

        let resolvedUrl: string | null = null;

        for (const candidate of orderedCandidates) {
          try {
            await preloadImage(candidate);
            resolvedUrl = candidate;
            break;
          } catch (candidateError) {
          }
        }

        if (resolvedUrl) {
          
          // Reset error state before setting new URL
          setImageError(false);
          setImageLoading(true);
          setErrorMessage(null);
          
          // Set the new URL - this will trigger useEffect to reset states
          setRetryUrl(resolvedUrl);
          
          
          // Force a small delay to ensure state updates propagate
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return;
        }

        throw new Error('No valid image URL could be loaded successfully');
      } else {
        throw new Error('No results found for this image search');
      }
    } catch (error: any) {
      
      // Check if it's a network error vs no results
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network') || error.message?.includes('CONNECTION_REFUSED') || error.response === undefined) {
        setErrorMessage('Unable to connect to image search service. Please ensure the backend server is running.');
      } else if (error.response?.status === 401) {
        setErrorMessage('Authentication required. Please refresh the page and try again.');
      } else if (error.response?.status >= 500) {
        setErrorMessage('Image search service error. Please try again later.');
      } else if (error.message?.includes('No valid image URL')) {
        setErrorMessage('We found related images but none allow direct viewing. Please retry in a moment or open the suggested query in a new tab.');
      } else {
        setErrorMessage(error.message || 'Failed to find a new image. The image may not be available.');
      }
      setImageError(true);
      setImageLoading(false);
      // Don't clear retryUrl on error - keep it if we had one
    } finally {
      setRetrying(false);
    }
  };

  // Use retry URL if available, otherwise use original
  const displayUrl = retryUrl || item.url;
  
  // Debug logging
  useEffect(() => {
  }, [displayUrl, retryUrl, item.url, imageError]);

  // Don't try to load if URL is null, empty, or invalid
  // BUT: if we have imageError but displayUrl is valid, show the error UI (image failed to load)
  if (!displayUrl || displayUrl === 'null' || displayUrl.trim() === '') {
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
            {errorMessage 
              ? errorMessage
              : isProxyUrl 
                ? 'The image URL is a proxy link that is no longer accessible. Proxy URLs often fail to load.'
                : 'The image failed to load or is no longer available'}
          </p>
          {item.prompt && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2 text-left">
              <p className="text-purple-600 text-xs font-semibold mb-1">Suggested Image:</p>
              <p className="text-gray-700 text-xs">{item.prompt}</p>
            </div>
          )}
          {item.prompt && (
            <button
              onClick={handleRetry}
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
          )}
        </div>
        {(item.alt || item.title) && (
          <div className="mt-4 mb-2">
            {item.title && (
              <p className="text-gray-900 font-medium text-sm mb-1">{item.title}</p>
            )}
            {item.alt && (
              <p className="text-gray-600 text-sm">{item.alt}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div>
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
                key={`img-${displayUrl}-${retryUrl ? 'retry' : 'original'}`} // Force re-render when URL changes
                src={displayUrl}
                alt={item.alt || 'Image'}
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onError={(e) => {
                  const targetSrc = (e.target as HTMLImageElement)?.src;
                  
                  handleImageError();
                }}
                onLoad={(e) => {
                  handleImageLoad();
                }}
                onLoadStart={(e) => {
                }}
                onClick={(e) => {
                }}
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
        {(item.alt || item.title) && (
          <div className="mb-2">
            {item.title && (
              <p className="text-gray-900 font-medium text-sm mb-1">{item.title}</p>
            )}
            {item.alt && (
              <p className="text-gray-600 text-sm">{item.alt}</p>
            )}
          </div>
        )}
        {imageError && item.prompt && (
          <div className="mt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
              <p className="text-purple-600 text-xs font-semibold mb-1">
                Suggested Image:
              </p>
              <p className="text-gray-700 text-xs">{item.prompt}</p>
            </div>
            <button
              onClick={handleRetry}
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
            {errorMessage && (
              <p className="mt-2 text-xs text-red-600 text-center">{errorMessage}</p>
            )}
          </div>
        )}
        {item.prompt && !item.url && !retryUrl && !imageError && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-purple-600 text-xs font-semibold mb-1">
              Suggested Image:
            </p>
            <p className="text-gray-700 text-xs">{item.prompt}</p>
            <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Images are automatically searched and added during content generation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const { user, loading: authLoading } = useAuthGuard();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Progress tracking
  const totalLessons = course ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0) : 0;
  const { progress: courseProgress, toggle: toggleProgress, isCompleted } = useProgress(courseId || '', totalLessons);
  
  // Selection state
  const [activeTab, setActiveTab] = useState<TabType>('theory');
  
  // AI Tutor Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Module expansion state
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
  const toggleModule = (moduleOrder: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleOrder)) {
        newSet.delete(moduleOrder);
      } else {
        newSet.add(moduleOrder);
      }
      return newSet;
    });
  };
  
  // Regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const initialLessonProgress: LessonGenerationProgress = {
    isGenerating: false,
    lessonTitle: '',
    currentStep: '',
    percentage: 0,
    estimatedTimeRemaining: 0,
  };
  const [lessonProgress, setLessonProgress] = useState<LessonGenerationProgress>(initialLessonProgress);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancelledRef = useRef(false);
  const lessonAbortControllerRef = useRef<AbortController | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

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

  // Find the lesson and module from the lessonId
  const getLessonAndModule = () => {
    if (!course) return { lesson: null, module: null };
    
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => {
        const id = typeof l._id === 'string' ? l._id : (l._id as any)?.toString?.() || '';
        return id === lessonId;
      });
      if (lesson) {
        return { lesson, module };
      }
    }
    return { lesson: null, module: null };
  };

  const { lesson, module } = getLessonAndModule();
  const hasContent = lesson?.content;

  // Generate lesson content function
  const handleGenerateLessonContent = async () => {
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
      
      await generate.content({
        courseId: course._id,
        moduleOrder: module.order,
        lessonOrder: lesson.order,
        lessonId: lesson._id,
      }, { signal: controller.signal });

      if (isCancelledRef.current) {
        return;
      }

      setLessonProgress(prev => ({
        ...prev,
        currentStep: 'Finalizing lesson...',
        percentage: Math.max(prev.percentage, 78),
        estimatedTimeRemaining: Math.max(1, Math.ceil(prev.estimatedTimeRemaining / 2)),
      }));

      // Refetch course to get updated content
      await fetchCourse();
      if (isCancelledRef.current) {
        return;
      }

      setLessonProgress(prev => ({
        ...prev,
        currentStep: 'Lesson ready!',
        percentage: 100,
        estimatedTimeRemaining: 0,
      }));
      
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') {
        setLessonProgress(prev => ({
          ...prev,
          currentStep: 'Cancelled',
          estimatedTimeRemaining: 0,
        }));
      } else {
      }
    } finally {
      lessonAbortControllerRef.current = null;
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      
      // Only reset if not cancelled (cancellation handler already handles reset)
      if (!isCancelledRef.current || lessonProgress.currentStep === 'Lesson ready!') {
        resetTimeoutRef.current = setTimeout(() => setLessonProgress(initialLessonProgress), 400);
      }
      
      setIsRegenerating(false);
      // Don't reset isCancelling here if it was cancelled (let the cancellation handler manage it)
      if (!isCancelledRef.current) {
        setIsCancelling(false);
      }
    }
  };

  const handleStopLessonGeneration = () => {
    if (!lessonProgress.isGenerating || isCancelling) {
      return;
    }

    setIsCancelling(true);
    isCancelledRef.current = true;
    lessonAbortControllerRef.current?.abort();
    
    // Immediately update UI and close modal after a short delay
    setLessonProgress(prev => ({
      ...prev,
      currentStep: 'Cancelled',
      percentage: 0,
      estimatedTimeRemaining: 0,
    }));
    
    // Close modal after a brief delay to show cancellation state
    setTimeout(() => {
      setLessonProgress(initialLessonProgress);
      setIsCancelling(false);
      setIsRegenerating(false);
    }, 1500);
  };


  if (loading || authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#F8F8FC]"
      >
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"
          ></div>
          <p className="mt-4 text-lg text-gray-700">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !lesson || !module) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#F8F8FC]"
      >
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <X className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Lesson Not Found</h2>
          <p className="mb-6 text-gray-600">{error || 'The requested lesson could not be found'}</p>
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string | React.ComponentType<any> }[] = [
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'example', label: 'Example', icon: Lightbulb },
    { id: 'exercise', label: 'Exercise', icon: PenTool },
    { id: 'quiz', label: 'Quiz', icon: Target },
  ];

  return (
    <div 
      className="min-h-screen pt-20 bg-[#F8F8FC]"
    >
      <div className="relative z-10 container mx-auto px-4 lg:px-6 py-12">
        <div className="flex gap-4">
          {/* Left Sidebar - Course Details */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >

              {/* Course Header */}
              <div 
                className="bg-white border border-purple-200 rounded-2xl p-6 mb-6 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                onClick={() => router.push(`/course/${courseId}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold uppercase text-purple-600">{course.title}</h3>
                </div>
              </div>

              {/* Course Modules */}
              <div 
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
              >
                <div className="space-y-1">
                  {course.modules.map((mod, modIndex) => {
                    const isExpanded = expandedModules.has(mod.order);
                    const isCurrentModule = mod.lessons.some(less => less._id === lessonId);
                    
                    return (
                      <div key={mod._id}>
                        {/* Module Header */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex-1 flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              isCurrentModule 
                                ? 'bg-purple-100 border border-purple-300' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to first lesson of this module
                              const firstLesson = mod.lessons.sort((a, b) => a.order - b.order)[0];
                              if (firstLesson) {
                                router.push(`/course/${courseId}/lesson/${firstLesson._id}`);
                              }
                            }}
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {mod.title}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModule(mod.order);
                            }}
                            className={`p-2 rounded-lg transition-all ${
                              isExpanded 
                                ? 'bg-gray-100 text-gray-700' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
                          >
                            <svg 
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Module Lessons - Collapsible */}
                        {isExpanded && (
                          <div className="ml-4 mt-2 space-y-1">
                            {mod.lessons.map((less, lessIndex) => {
                              const isCurrentLesson = less._id === lessonId;
                              const lessonCompleted = isCompleted(mod.order, less.order);
                              
                              return (
                                <div
                                  key={less._id}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                    isCurrentLesson 
                                      ? 'bg-purple-100 border border-purple-300' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => router.push(`/course/${courseId}/lesson/${less._id}`)}
                                >
                                  <div className={`w-2 h-2 rounded-full ${
                                    lessonCompleted ? 'bg-green-600' : isCurrentLesson ? 'bg-purple-600' : 'bg-gray-400'
                                  }`} />
                                  <span className={`text-sm ${
                                    isCurrentLesson ? 'text-purple-600 font-medium' : 'text-gray-600'
                                  }`}>
                                    {less.title}
                                  </span>
                                  {lessonCompleted && (
                                    <svg className="w-4 h-4 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center justify-end mb-6">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-lg transition-colors bg-white border border-gray-200 text-gray-900 hover:border-purple-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-72 z-50 lg:hidden transform transition-transform duration-300 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div 
            className="h-full overflow-y-auto p-6 bg-white border-r border-gray-200"
          >
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Course Details</h3>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>


            {/* Course Header - Mobile */}
            <div 
              className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
              onClick={() => {
                router.push(`/course/${courseId}`);
                setIsMobileSidebarOpen(false);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.5v4.556l-1.69-.723a1 1 0 00-.787 0l-7-3A1 1 0 000 11.5v-4a1 1 0 00.31-.103l7-3zM14 12.5v-4l-1.69-.723a1 1 0 00-.787 0l-7 3a1 1 0 000 1.838l7 3a1 1 0 00.787 0L14 12.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold uppercase text-purple-600">{course.title}</h3>
              </div>
            </div>

            {/* Course Modules - Mobile */}
            <div 
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="space-y-1">
                {course.modules.map((mod, modIndex) => {
                  const isExpanded = expandedModules.has(mod.order);
                  const isCurrentModule = mod.lessons.some(less => less._id === lessonId);
                  
                  return (
                    <div key={mod._id}>
                      {/* Module Header */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex-1 flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            isCurrentModule 
                              ? 'bg-purple-100 border border-purple-300' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to first lesson of this module
                            const firstLesson = mod.lessons.sort((a, b) => a.order - b.order)[0];
                            if (firstLesson) {
                              router.push(`/course/${courseId}/lesson/${firstLesson._id}`);
                              setIsMobileSidebarOpen(false);
                            }
                          }}
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {mod.title}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModule(mod.order);
                          }}
                          className={`p-2 rounded-lg transition-all ${
                            isExpanded 
                              ? 'bg-gray-100 text-gray-700' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
                        >
                          <svg 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Module Lessons - Collapsible */}
                      {isExpanded && (
                        <div className="ml-4 mt-2 space-y-1">
                          {mod.lessons.map((less, lessIndex) => {
                            const isCurrentLesson = less._id === lessonId;
                            const lessonCompleted = isCompleted(mod.order, less.order);
                            
                            return (
                              <div
                                key={less._id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                  isCurrentLesson 
                                    ? 'bg-purple-100 border border-purple-300' 
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => {
                                  router.push(`/course/${courseId}/lesson/${less._id}`);
                                  setIsMobileSidebarOpen(false);
                                }}
                              >
                                  <div className={`w-2 h-2 rounded-full ${
                                    lessonCompleted ? 'bg-green-600' : isCurrentLesson ? 'bg-purple-600' : 'bg-gray-400'
                                  }`} />
                                <span className={`text-sm ${
                                  isCurrentLesson ? 'text-purple-600 font-medium' : 'text-gray-600'
                                }`}>
                                  {less.title}
                                </span>
                                {lessonCompleted && (
                                  <svg className="w-4 h-4 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>


        {/* Lesson Header */}
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
              {lesson.summary && (
                <p className="text-lg text-gray-600">{lesson.summary}</p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Generate Lesson Content Button - Only show if lesson has no content */}
              {!hasContent && (
                <button
                  onClick={handleGenerateLessonContent}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Lesson
                    </>
                  )}
                </button>
              )}
              
              {/* Lesson Completion Toggle */}
              <button
                onClick={() => {
                  const completed = isCompleted(module.order, lesson.order);
                  toggleProgress(module.order, lesson.order, !completed);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isCompleted(module.order, lesson.order)
                    ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:text-purple-600'
                }`}
              >
                {courseProgress.syncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg 
                      className="w-4 h-4" 
                      fill={isCompleted(module.order, lesson.order) ? 'currentColor' : 'none'} 
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
                    {isCompleted(module.order, lesson.order) ? 'Completed' : 'Mark Complete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Content Area */}
          {!hasContent ? (
            <div className="p-12 text-center">
              <div className="mb-4 flex justify-center">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Content Yet</h3>
              <p className="text-gray-600 mb-6">
                This lesson doesn't have content yet. Please go back to the course overview to generate content.
              </p>
              <button
                onClick={() => router.push(`/course/${courseId}`)}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                Back to Course
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 px-6">
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 hover:text-purple-600'
                      }`}
                    >
                      {typeof tab.icon === 'string' ? tab.icon : <tab.icon className="w-4 h-4" />}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'theory' && lesson.content && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                          <BookOpen className="w-6 h-6" /> Theory
                        </h3>
                        <div className="text-gray-700">
                          <MarkdownView content={lesson.content.theoryMd} />
                        </div>
                        
                        {lesson.content.keyTakeaways.length > 0 && (
                          <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-xl">
                            <h4 className="text-lg font-semibold text-purple-600 mb-3 flex items-center gap-2">
                              <Key className="w-5 h-5" /> Key Takeaways
                            </h4>
                            <ul className="space-y-2">
                              {lesson.content.keyTakeaways.map((takeaway, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="text-purple-600 mt-1">•</span>
                                  <span className="text-gray-700">{takeaway}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Related Images - Show above YouTube video */}
                        {lesson.content.media && lesson.content.media.filter(item => item.type === 'image').length > 0 && (
                          <div className="mt-8">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Image className="w-5 h-5" /> Related Images
                            </h4>
                            <div className="mb-6">
                              {lesson.content.media
                                .filter(item => item.type === 'image')
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
                          <VideoEmbed topic={lesson.title} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'example' && lesson.content && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                          <Lightbulb className="w-6 h-6" /> Example
                        </h3>
                        <div className="text-gray-700">
                          <MarkdownView content={lesson.content.exampleMd} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'exercise' && lesson.content && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                          <PenTool className="w-6 h-6" /> Exercise
                        </h3>
                        <div className="text-gray-700">
                          <MarkdownView content={lesson.content.exerciseMd} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'quiz' && lesson.content && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                          <Target className="w-6 h-6" /> Quiz
                        </h3>
                        <QuizBlock 
                          questions={lesson.content.quiz.questions}
                          courseId={course?._id}
                          lessonId={lesson._id?.toString()}
                          moduleOrder={module?.order}
                          lessonOrder={lesson.order}
                        />
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Lesson Generation Modal */}
      <AnimatePresence>
        {lessonProgress.isGenerating && (
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
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                className="w-full"
                style={{ maxWidth: '28rem' }}
              >
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
                        <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white">Generating Lesson</h3>
                        <p className="text-white/90 text-xs line-clamp-1 font-medium">{lessonProgress.lessonTitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 bg-white">
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200" />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="url(#lesson-progress)"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - lessonProgress.percentage / 100)}`}
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
                          <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{lessonProgress.percentage}%</span>
                          <span className="text-xs text-gray-600 font-medium mt-1">Complete</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full animate-pulse mt-1 flex-shrink-0 shadow-lg shadow-purple-500/30" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-purple-600 font-semibold mb-1.5 uppercase tracking-wide">{lessonProgress.currentStep || 'Preparing lesson...'}</div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{lesson.title}</h4>
                          <p className="text-xs text-gray-600 font-medium">Module {module.order} · Lesson {lesson.order}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-600 font-semibold">Lesson</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">1<span className="text-gray-400 text-base ml-1">/1</span></div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-orange-50 rounded-lg">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-600 font-semibold">Time Left</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">~{Math.max(0, lessonProgress.estimatedTimeRemaining)}<span className="text-gray-400 text-base ml-1">m</span></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-semibold">Overall Progress</span>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{lessonProgress.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${lessonProgress.percentage}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 text-xs text-gray-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                        <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Please don't close this window</span>
                      </div>

                      <motion.button
                        onClick={handleStopLessonGeneration}
                        type="button"
                        disabled={isCancelling || lessonProgress.currentStep === 'Lesson ready!' || lessonProgress.currentStep === 'Cancelled'}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm shadow-sm hover:shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {isCancelling ? 'Cancelling...' : 'Stop Generation'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Floating AI Tutor Button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        {/* Tooltip */}
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
          <div className="text-xs text-gray-600 font-medium">Hey! I'm your AI tutor. Ask me anything or if you have doubts, I'm here to help!</div>
          {/* Arrow */}
          <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 w-0 h-0 border-l-8 border-l-white border-t-4 border-b-4 border-t-transparent border-b-transparent"></div>
        </motion.div>

        {/* Floating Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              "0 10px 25px rgba(147, 51, 234, 0.3)",
              "0 10px 25px rgba(147, 51, 234, 0.5)",
              "0 10px 25px rgba(147, 51, 234, 0.3)"
            ]
          }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 15px 35px rgba(147, 51, 234, 0.6)"
          }}
          whileTap={{ scale: 0.9 }}
          transition={{
            scale: { duration: 0.2 },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          onClick={() => setIsChatOpen(true)}
          className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
        >
          {/* Pulsing ring animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border-2 border-white/30"
          />
          
          {/* Robot icon with bounce animation */}
          <motion.div 
            className="relative z-10"
            animate={{
              y: [0, -2, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{
              scale: 1.2,
              rotate: [0, -10, 10, 0]
            }}
          >
            <Bot className="w-8 h-8" />
          </motion.div>
        </motion.button>
          </div>
        </div>
      </div>

      {/* AI Teacher Chat */}
      <AITeacherChat
        courseId={courseId}
        courseTitle={course.title}
        moduleTitle={module.title}
        lessonTitle={lesson.title}
        lessonContent={lesson.content?.theoryMd}
        language="en"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
