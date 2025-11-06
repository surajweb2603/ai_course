'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { generate } from '@/lib/api';
import { motion } from 'framer-motion';
import { useAuthGuard } from '@/lib/useAuthGuard';
import SubtopicSelector from '@/components/SubtopicSelector';
import { Bot, Sparkles, BookOpen, BarChart3 } from 'lucide-react';

export default function NewCoursePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('en');
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatingStage, setGeneratingStage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!topic.trim()) {
      setError('Topic is required');
      return;
    }

    if (topic.trim().length > 200) {
      setError('Topic must be 200 characters or less');
      return;
    }

    setIsSubmitting(true);
    setGeneratingStage('Analyzing topic...');

    try {
      // Update stage
      setTimeout(() => setGeneratingStage('Generating course structure...'), 1000);
      setTimeout(() => setGeneratingStage('Creating modules and lessons...'), 3000);

      const response = await generate.outline({
        topic: topic.trim(),
        language,
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
      });

      setGeneratingStage('Finalizing...');
      
      // Redirect to the new course detail page
      router.push(`/course/${response.courseId}`);
    } catch (err: any) {
      
      // Handle upgrade required error
      if (err.response?.status === 403 && err.response?.data?.upgradeRequired) {
        const upgradeData = err.response.data;
        setError(`${upgradeData.error}\n\nCurrent plan: ${upgradeData.currentPlan}\nLimit: ${upgradeData.limit}\n\nPlease upgrade your plan to continue.`);
      } else {
        setError(err.response?.data?.error || 'Failed to generate course outline');
      }
      
      setIsSubmitting(false);
      setGeneratingStage('');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F8FC] pt-20">
      <div className="relative z-10 container mx-auto px-6 lg:px-8 py-12 max-w-4xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
              NEW COURSE
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
            {isSubmitting ? 'Generating Course...' : 'Create a New Course'}
          </h1>
          <p className="text-gray-700 text-lg">
            {isSubmitting 
              ? 'AI is generating your personalized course structure...' 
              : 'Enter a topic and let AI create a complete course outline with modules and lessons.'
            }
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
        >
          {isSubmitting ? (
            // Loading State with Shimmer
            <div className="space-y-6">
              <div className="text-center py-8">
                {/* Animated spinner */}
                <div className="inline-block relative w-20 h-20 mb-6">
                  <div className="absolute border-4 border-purple-200 rounded-full w-20 h-20"></div>
                  <div className="absolute border-4 border-purple-600 rounded-full w-20 h-20 animate-spin border-t-transparent"></div>
                </div>
                
                <p className="text-xl font-medium text-gray-900 mb-3">
                  {generatingStage}
                </p>
                <p className="text-sm text-gray-600">
                  This may take 10-15 seconds
                </p>
              </div>

              {/* Shimmer placeholders for modules */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  <div className="whitespace-pre-line mb-3">{error}</div>
                  {error.includes('Upgrade your plan') && (
                    <button
                      type="button"
                      onClick={() => window.location.href = '/pricing'}
                      className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all"
                    >
                      Upgrade Plan
                    </button>
                  )}
                </div>
              )}

              {/* Topic */}
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Course Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Introduction to Machine Learning"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                  maxLength={200}
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-600">
                  {topic.length}/200 characters
                </p>
              </div>

              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                  <option value="it">Italian</option>
                </select>
              </div>

              {/* Subtopics (Optional) */}
              <SubtopicSelector
                selectedSubtopics={selectedSubtopics}
                onSubtopicsChange={setSelectedSubtopics}
                disabled={isSubmitting}
              />

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bot className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-purple-600 font-semibold mb-1">AI-Powered Generation</h3>
                    <p className="text-gray-700 text-sm">
                      AI will generate a complete course outline with 6-8 modules and 3-5 lessons per module, 
                      tailored to your topic and preferences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !topic.trim()}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Generate Course with AI
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="mb-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">Structured Content</h3>
            <p className="text-gray-600 text-sm">
              Organize your course into modules and lessons
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="mb-2">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">AI-Powered</h3>
            <p className="text-gray-600 text-sm">
              Generate content automatically with AI assistance
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">Track Progress</h3>
            <p className="text-gray-600 text-sm">
              Monitor learning progress and completion rates
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

