'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MarkdownView from '@/components/MarkdownView';
import QuizBlock from '@/components/QuizBlock';
import { normalizeYouTubeEmbedUrl } from '../../utils/youtube';

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
  theoryMd?: string;
  exampleMd?: string;
  exerciseMd?: string;
  estimatedMinutes?: number;
  keyTakeaways: string[];
  media?: MediaItem[];
  quiz?: {
    questions: QuizQuestion[];
  };
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

export default function PublicCoursePage() {
  const params = useParams();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<{moduleId: string, lessonId: string} | null>(null);

  useEffect(() => {
    if (id) {
      fetchPublicCourse();
    } else {
      setError('No course ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchPublicCourse = async () => {
    try {
      setLoading(true);
      
      // Use direct fetch instead of API client to avoid any auth issues
      const response = await fetch(`/api/courses/${id}/share`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCourse(data.course);
    } catch (err: any) {
      setError(`Failed to load course: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Available</h2>
          <p className="text-gray-600 mb-6">{error || 'This course is private or does not exist'}</p>
          <div className="text-xs text-gray-500 mb-4">
            Debug info: {error ? `Error: ${error}` : 'No course data received'}
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FC]">

      <div className="relative z-10 container mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 text-sm font-medium rounded-full mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Shared Course
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{course.title}</h1>
          {course.summary && (
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">{course.summary}</p>
          )}
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
              {course.language.toUpperCase()}
            </span>
            <span>{course.modules.length} modules</span>
            <span>•</span>
            <span>{course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons</span>
            {course.tags && course.tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-2">
                  {course.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Course Modules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {course.modules
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <motion.div
                key={module._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * module.order }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden shadow-sm"
              >
                {/* Module Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-white font-bold text-lg">{module.order}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2" title={module.title}>
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                  {module.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <button
                        key={lesson._id}
                        onClick={() => setSelectedLesson({moduleId: module._id, lessonId: lesson._id})}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-all text-left group"
                      >
                        <span className="text-xs text-gray-500 flex-shrink-0 w-4">{lesson.order}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 truncate group-hover:text-purple-600 transition-colors font-medium" title={lesson.title}>
                            {lesson.title}
                          </div>
                          {lesson.summary && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {lesson.summary}
                            </div>
                          )}
                          {lesson.content?.estimatedMinutes && (
                            <div className="text-xs text-purple-600 mt-1 font-medium">
                              ~{lesson.content.estimatedMinutes} min
                            </div>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                </div>

                {/* Module Info */}
                <div className="text-xs text-gray-500 text-center">
                  Click lessons to view full content • Interactive features require login
                </div>
              </motion.div>
            ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to take this course?</h3>
            <p className="text-gray-700 mb-6">
              You can view all lesson content here. To access interactive features, progress tracking, 
              and personalized learning, please create an account or log in.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/register'}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                Create Free Account
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300"
              >
                Log In
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lesson Preview Modal */}
        {selectedLesson && course && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            >
              {(() => {
                const module = course.modules.find(m => m._id === selectedLesson.moduleId);
                const lesson = module?.lessons.find(l => l._id === selectedLesson.lessonId);
                
                if (!module || !lesson) return null;
                
                return (
                  <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{lesson.title}</h3>
                          <p className="text-purple-100 text-xs">Module {module.order}: {module.title}</p>
                        </div>
                        <button
                          onClick={() => setSelectedLesson(null)}
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
                      {lesson.summary && (
                        <section>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Lesson Summary</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{lesson.summary}</p>
                        </section>
                      )}

                      {lesson.content?.estimatedMinutes && (
                        <section>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Estimated time: {lesson.content.estimatedMinutes} minutes
                          </div>
                        </section>
                      )}

                      {lesson.content?.keyTakeaways && lesson.content.keyTakeaways.length > 0 && (
                        <section>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Key Takeaways</h4>
                          <ul className="space-y-1">
                            {lesson.content.keyTakeaways.map((takeaway, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-purple-600 mt-1">•</span>
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {lesson.content?.theoryMd && (
                        <section>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Core Concepts</h4>
                          <MarkdownView content={lesson.content.theoryMd} />
                        </section>
                      )}

                      {lesson.content?.exampleMd && (
                        <section>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Guided Example</h4>
                          <MarkdownView content={lesson.content.exampleMd} />
                        </section>
                      )}

                      {lesson.content?.exerciseMd && (
                        <section>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Practice Exercise</h4>
                          <MarkdownView content={lesson.content.exerciseMd} />
                        </section>
                      )}

                      {lesson.content?.media && (
                        <>
                          {lesson.content.media.filter(item => item.type === 'image' && item.url).slice(0, 1).map((item, index) => (
                            <div key={`image-${index}`} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mb-4">
                              <img
                                src={item.url || ''}
                                alt={(item.alt ?? item.title ?? `Lesson media ${index + 1}`) || ''}
                                className="w-full h-auto"
                              />
                              {(item.title || item.alt) && (
                                <div className="p-4 space-y-1">
                                  {item.title && (
                                    <p className="text-gray-900 font-medium text-sm">{item.title}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
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
                                {(item.title || item.alt) && (
                                  <div className="p-4 space-y-1">
                                    {item.title && (
                                      <p className="text-gray-900 font-medium text-sm">{item.title}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}

                      {lesson.content?.quiz?.questions && lesson.content.quiz.questions.length > 0 && (
                        <section>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Check Your Understanding</h4>
                          <QuizBlock questions={lesson.content.quiz.questions} />
                        </section>
                      )}

                      {/* Full Content Notice */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h5 className="text-xs font-semibold text-green-700 mb-1">Full Lesson Content</h5>
                            <p className="text-xs text-gray-700">
                              You're viewing the complete lesson content. For interactive features, progress tracking,
                              and personalized learning, create an account or log in.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 p-3 flex gap-2">
                      <button
                        onClick={() => setSelectedLesson(null)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close Lesson
                      </button>
                      <a
                        href={`/share/${course._id}/lesson/${lesson._id}`}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg text-center hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                      >
                        Open Full Lesson View
                      </a>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
