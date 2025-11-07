'use client';

import { useState, useEffect, useRef } from 'react';
import { courses } from '@/lib/api';

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

interface LessonGenerationProgress {
  isGenerating: boolean;
  lessonTitle: string;
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining: number;
}

export function useLessonData(courseId: string, lessonId: string) {
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

  const getLessonAndModule = () => {
    if (!course) return { lesson: null, module: null };

    for (const module of course.modules) {
      const lesson = module.lessons.find((l) => {
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

  const refetch = async () => {
    if (!courseId) return;
    try {
      const response = await courses.getById(courseId);
      setCourse(response.course);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load course');
    }
  };

  return {
    course,
    lesson,
    module,
    hasContent,
    loading,
    error,
    refetch,
    setCourse,
  };
}

export function useLessonGeneration() {
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
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return {
    isRegenerating,
    setIsRegenerating,
    lessonProgress,
    setLessonProgress,
    isCancelling,
    setIsCancelling,
    isCancelledRef,
    lessonAbortControllerRef,
    resetTimeoutRef,
    initialLessonProgress,
  };
}

