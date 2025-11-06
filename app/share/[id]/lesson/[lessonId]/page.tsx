'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MarkdownView from '@/components/MarkdownView';
import QuizBlock from '@/components/QuizBlock';
import { normalizeYouTubeEmbedUrl } from '../../../../utils/youtube';

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
  title: string;
  language: string;
  summary?: string;
  tags?: string[];
  visibility: 'private' | 'unlisted' | 'public';
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export default function SharedLessonPage() {
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/share`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setCourse(data.course);
      } catch (err: any) {
        setError(err.message || 'Failed to load shared course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const { lesson, module } = useMemo(() => {
    if (!course) {
      return { lesson: null, module: null };
    }

    for (const mod of course.modules) {
      const currentLesson = mod.lessons.find((l) => {
        const id = typeof l._id === 'string' ? l._id : (l._id as any)?.toString?.() || '';
        return id === lessonId;
      });

      if (currentLesson) {
        return { lesson: currentLesson, module: mod };
      }
    }

    return { lesson: null, module: null };
  }, [course, lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !lesson || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Available</h2>
          <p className="text-gray-600 mb-6">
            {error || 'We could not find this lesson. It might have been removed or is no longer shareable.'}
          </p>
          <Link
            href={`/share/${courseId}`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            Back to Course Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FC]">

      <div className="relative z-10 container mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/share/${course._id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to shared course
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
              {course.language.toUpperCase()}
            </span>
            <span>{course.modules.length} modules</span>
            <span>•</span>
            <span>
              {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8"
        >
          <aside className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Modules</h3>
              <div className="space-y-5">
                {course.modules
                  .sort((a, b) => a.order - b.order)
                  .map((mod) => (
                    <div key={mod._id} className="space-y-3">
                      <div>
                        <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">
                          Module {mod.order}
                        </p>
                        <p className="text-sm text-gray-900 font-semibold">{mod.title}</p>
                      </div>
                      <div className="space-y-2">
                        {mod.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((l) => {
                            const isActive =
                              (typeof l._id === 'string' ? l._id : (l._id as any)?.toString?.() || '') ===
                              lessonId;
                            return (
                              <Link
                                key={l._id.toString()}
                                href={`/share/${course._id}/lesson/${l._id}`}
                                className={`block px-3 py-2 rounded-lg border ${
                                  isActive
                                    ? 'border-purple-600 bg-purple-50 text-gray-900'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                                }`}
                              >
                                <span className="text-xs text-gray-500 mr-2">#{l.order}</span>
                                {l.title}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Share this course</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy the link below to invite others to explore the full course without requiring an account.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 break-all font-mono">
                {typeof window !== 'undefined'
                  ? window.location.href
                  : `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${course._id}/lesson/${lesson._id}`}
              </div>
            </div>
          </aside>
          <section className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full w-fit">
                  Module {module.order}: {module.title}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {lesson.title}
                </h1>
                {lesson.summary && (
                  <p className="text-gray-600 text-base leading-relaxed">{lesson.summary}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Course</p>
                  <p className="text-gray-900 font-semibold text-sm">{course.title}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lesson Order</p>
                  <p className="text-gray-900 font-semibold text-sm">#{lesson.order}</p>
                </div>
                {lesson.content?.estimatedMinutes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estimated Time</p>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lesson.content.estimatedMinutes} minutes
                    </div>
                  </div>
                )}
              </div>

              {lesson.content?.keyTakeaways && lesson.content.keyTakeaways.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
                  <h2 className="text-lg font-semibold text-purple-600 mb-3">🔑 Key Takeaways</h2>
                  <ul className="space-y-2">
                    {lesson.content.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.content?.theoryMd && (
                <div className="space-y-4 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 pb-3 border-b border-gray-200">📚 Core Concepts</h2>
                  <MarkdownView content={lesson.content.theoryMd} />
                </div>
              )}

              {lesson.content?.exampleMd && (
                <div className="space-y-4 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 pb-3 border-b border-gray-200">💡 Guided Example</h2>
                  <MarkdownView content={lesson.content.exampleMd} />
                </div>
              )}

              {lesson.content?.exerciseMd && (
                <div className="space-y-4 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 pb-3 border-b border-gray-200">✏️ Practice Exercise</h2>
                  <MarkdownView content={lesson.content.exerciseMd} />
                </div>
              )}

              {lesson.content?.media && (
                <>
                  {/* Show only the first image in media */}
                  {lesson.content.media.filter(item => item.type === 'image' && item.url).slice(0, 1).map((item, index) => (
                    <div key={`image-${index}`} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mb-4">
                      <img
                        src={item.url || ''}
                        alt={(item.alt ?? item.title ?? `Lesson media ${index + 1}`) || ''}
                        className="w-full h-auto"
                      />
                      {(item.title || item.prompt || item.alt) && (
                        <div className="p-4 space-y-1">
                          {item.title && (
                            <p className="text-gray-900 font-medium text-sm">{item.title}</p>
                          )}
                          {/* Do not render prompt or alt/description for images */}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Show up to 3 videos in media */}
                  {lesson.content.media.filter(item => item.type === 'video' && item.url).slice(0, 3).map((item, index) => {
                    const embedUrl = normalizeYouTubeEmbedUrl(item.url || '');
                    return (
                      <div key={`video-${index}`} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mb-4">
                        <div className="relative aspect-video bg-black/40">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={(item.title ?? `Lesson media ${index + 1}`) || ''}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              frameBorder="0"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <p className="text-gray-600 text-sm">Invalid video URL</p>
                            </div>
                          )}
                        </div>
                        {(item.title || item.prompt || item.alt) && (
                          <div className="p-4 space-y-1">
                            {item.title && (
                              <p className="text-gray-900 font-medium text-sm">{item.title}</p>
                            )}
                            {/* Do not render alt/description */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {lesson.content?.quiz?.questions && lesson.content.quiz.questions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900 pb-3 border-b border-gray-200">🎯 Check Your Understanding</h2>
                  <QuizBlock questions={lesson.content.quiz.questions} />
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-green-700 mb-2">Enjoying this lesson?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Create a free account to unlock progress tracking, AI-powered tutoring, and personalized learning features.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Log In
                </Link>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
