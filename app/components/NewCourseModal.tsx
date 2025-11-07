'use client';

import { useState, FormEvent } from 'react';
import SubtopicSelector from '@/components/SubtopicSelector';

interface NewCourseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (course: any) => void;
}

/**
 * Loading state component
 */
function LoadingState({ generatingStage }: { generatingStage: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="inline-block relative w-16 h-16 mb-4">
          <div className="absolute border-4 border-blue-200 rounded-full w-16 h-16"></div>
          <div className="absolute border-4 border-blue-600 rounded-full w-16 h-16 animate-spin border-t-transparent"></div>
        </div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          {generatingStage}
        </p>
        <p className="text-sm text-gray-500">
          This may take 10-15 seconds
        </p>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6 mt-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Modal header component
 */
function ModalHeader({ 
  isSubmitting, 
  onClose 
}: { 
  isSubmitting: boolean; 
  onClose: () => void;
}) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-gray-900">
        {isSubmitting ? 'Generating Course...' : 'Create New Course'}
      </h2>
      <button
        onClick={onClose}
        disabled={isSubmitting}
        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Info box component
 */
function InfoBox() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
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
        <p className="text-sm text-blue-800">
          AI will generate a complete course outline with 6-8 modules and 3-5 lessons per module.
        </p>
      </div>
    </div>
  );
}

/**
 * Form fields component
 */
function FormFields({
  topic,
  setTopic,
  language,
  setLanguage,
  selectedSubtopics,
  setSelectedSubtopics,
  isSubmitting,
}: {
  topic: string;
  setTopic: (topic: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  selectedSubtopics: string[];
  setSelectedSubtopics: (subtopics: string[]) => void;
  isSubmitting: boolean;
}) {
  return (
    <>
      <div>
        <label
          htmlFor="topic"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Course Topic <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Introduction to Machine Learning"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
          maxLength={200}
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-500">
          {topic.length}/200 characters
        </p>
      </div>

      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      <SubtopicSelector
        selectedSubtopics={selectedSubtopics}
        onSubtopicsChange={setSelectedSubtopics}
        disabled={isSubmitting}
      />
    </>
  );
}

/**
 * Validate topic
 */
function validateTopic(topic: string, setError: (error: string) => void): boolean {
  if (!topic.trim()) {
    setError('Topic is required');
    return false;
  }

  if (topic.trim().length > 200) {
    setError('Topic must be 200 characters or less');
    return false;
  }

  return true;
}

/**
 * Generate course outline
 */
async function generateOutline(
  topic: string,
  language: string,
  selectedSubtopics: string[],
  setGeneratingStage: (stage: string) => void,
  onCreated: (course: any) => void,
  onClose: () => void
) {
  const { generate } = await import('@/lib/api');
  
  setTimeout(() => setGeneratingStage('Generating course structure...'), 1000);
  setTimeout(() => setGeneratingStage('Creating modules and lessons...'), 3000);

  const response = await generate.outline({
    topic: topic.trim(),
    language,
    subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
  });

  setGeneratingStage('Finalizing...');
  onCreated({ id: response.courseId });
  onClose();
}

/**
 * Reset form state
 */
function resetFormState(
  setTopic: (topic: string) => void,
  setLanguage: (language: string) => void,
  setSelectedSubtopics: (subtopics: string[]) => void,
  setError: (error: string) => void,
  setGeneratingStage: (stage: string) => void
) {
  setTopic('');
  setLanguage('en');
  setSelectedSubtopics([]);
  setError('');
  setGeneratingStage('');
}

export default function NewCourseModal({
  open,
  onClose,
  onCreated,
}: NewCourseModalProps) {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('en');
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatingStage, setGeneratingStage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateTopic(topic, setError)) {
      return;
    }

    setIsSubmitting(true);
    setGeneratingStage('Analyzing topic...');

    try {
      await generateOutline(
        topic,
        language,
        selectedSubtopics,
        setGeneratingStage,
        onCreated,
        onClose
      );
      resetFormState(setTopic, setLanguage, setSelectedSubtopics, setError, setGeneratingStage);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to generate course outline';
      setError(errorMessage);
      setGeneratingStage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetFormState(setTopic, setLanguage, setSelectedSubtopics, setError, setGeneratingStage);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <ModalHeader isSubmitting={isSubmitting} onClose={handleClose} />

        {isSubmitting ? (
          <LoadingState generatingStage={generatingStage} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <FormFields
              topic={topic}
              setTopic={setTopic}
              language={language}
              setLanguage={setLanguage}
              selectedSubtopics={selectedSubtopics}
              setSelectedSubtopics={setSelectedSubtopics}
              isSubmitting={isSubmitting}
            />

            <InfoBox />
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Generate Course
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
