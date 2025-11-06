'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { progress } from './api';

export interface ProgressState {
  percent: number;
  completed: Set<string>;
  syncing: boolean;
}

export interface UseProgressReturn {
  progress: ProgressState;
  toggle: (moduleOrder: number, lessonOrder: number, completed: boolean) => Promise<void>;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  refresh: () => Promise<void>;
}

interface QueuedUpdate {
  moduleOrder: number;
  lessonOrder: number;
  completed: boolean;
  timestamp: number;
}

/**
 * Generate a lesson key from module and lesson order
 */
function makeLessonKey(moduleOrder: number, lessonOrder: number): string {
  return `${moduleOrder}:${lessonOrder}`;
}

/**
 * Get localStorage key for progress cache
 */
function getProgressCacheKey(courseId: string): string {
  return `aicourse_progress_${courseId}`;
}

/**
 * Get localStorage key for offline outbox
 */
function getOutboxKey(courseId: string): string {
  return `aicourse_outbox_${courseId}`;
}

/**
 * Load progress from localStorage
 */
function loadCachedProgress(courseId: string): ProgressState | null {
  try {
    const cached = localStorage.getItem(getProgressCacheKey(courseId));
    if (cached) {
      const data = JSON.parse(cached);
      return {
        percent: data.percent || 0,
        completed: new Set(data.completed || []),
        syncing: false
      };
    }
  } catch (error) {
  }
  return null;
}

/**
 * Save progress to localStorage
 */
function saveCachedProgress(courseId: string, progressState: ProgressState): void {
  try {
    const data = {
      percent: progressState.percent,
      completed: Array.from(progressState.completed),
      timestamp: Date.now()
    };
    localStorage.setItem(getProgressCacheKey(courseId), JSON.stringify(data));
  } catch (error) {
  }
}

/**
 * Load queued updates from localStorage
 */
function loadQueuedUpdates(courseId: string): QueuedUpdate[] {
  try {
    const queued = localStorage.getItem(getOutboxKey(courseId));
    if (queued) {
      return JSON.parse(queued);
    }
  } catch (error) {
  }
  return [];
}

/**
 * Save queued updates to localStorage
 */
function saveQueuedUpdates(courseId: string, updates: QueuedUpdate[]): void {
  try {
    localStorage.setItem(getOutboxKey(courseId), JSON.stringify(updates));
  } catch (error) {
  }
}

/**
 * Clear queued updates from localStorage
 */
function clearQueuedUpdates(courseId: string): void {
  try {
    localStorage.removeItem(getOutboxKey(courseId));
  } catch (error) {
  }
}

/**
 * Hook for managing course progress with optimistic updates and offline support
 */
export function useProgress(courseId: string, totalLessons?: number): UseProgressReturn {
  const [progressState, setProgressState] = useState<ProgressState>({
    percent: 0,
    completed: new Set(),
    syncing: false
  });

  const isOnlineRef = useRef(typeof window !== 'undefined' ? navigator.onLine : true);
  const totalLessonsRef = useRef(totalLessons || 0);

  // Early return if no courseId
  if (!courseId) {
    return {
      progress: progressState,
      toggle: async () => {},
      isCompleted: () => false,
      refresh: async () => {}
    };
  }

  // Update total lessons when provided
  useEffect(() => {
    if (totalLessons !== undefined) {
      totalLessonsRef.current = totalLessons;
    }
  }, [totalLessons]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      // Flush queued updates when coming back online
      flushQueuedUpdates();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [courseId]);

  // Load initial progress from server
  const loadProgress = useCallback(async () => {
    try {
      setProgressState(prev => ({ ...prev, syncing: true }));
      
      const response = await progress.get(courseId);
      const serverProgress = response.data;
      
      setProgressState({
        percent: serverProgress.percent,
        completed: new Set(serverProgress.completedLessonKeys),
        syncing: false
      });

      // Save to cache
      saveCachedProgress(courseId, {
        percent: serverProgress.percent,
        completed: new Set(serverProgress.completedLessonKeys),
        syncing: false
      });
    } catch (error) {
      
      // Fallback to cached progress
      const cached = loadCachedProgress(courseId);
      if (cached) {
        setProgressState(cached);
      }
      
      setProgressState(prev => ({ ...prev, syncing: false }));
    }
  }, [courseId]);

  // Flush queued updates to server
  const flushQueuedUpdates = useCallback(async () => {
    if (!isOnlineRef.current) return;

    const queuedUpdates = loadQueuedUpdates(courseId);
    if (queuedUpdates.length === 0) return;

    try {
      setProgressState(prev => ({ ...prev, syncing: true }));

      const response = await progress.bulkUpdate({
        courseId,
        items: queuedUpdates.map(update => ({
          moduleOrder: update.moduleOrder,
          lessonOrder: update.lessonOrder,
          completed: update.completed
        }))
      });

      const serverProgress = response.data;
      
      setProgressState({
        percent: serverProgress.percent,
        completed: new Set(serverProgress.completedLessonKeys),
        syncing: false
      });

      // Save to cache and clear queue
      saveCachedProgress(courseId, {
        percent: serverProgress.percent,
        completed: new Set(serverProgress.completedLessonKeys),
        syncing: false
      });
      clearQueuedUpdates(courseId);
    } catch (error) {
      setProgressState(prev => ({ ...prev, syncing: false }));
    }
  }, [courseId]);

  // Toggle lesson completion
  const toggle = useCallback(async (
    moduleOrder: number, 
    lessonOrder: number, 
    completed: boolean
  ) => {
    const key = makeLessonKey(moduleOrder, lessonOrder);
    
    // Optimistic update
    setProgressState(prev => {
      const newCompleted = new Set(prev.completed);
      
      if (completed) {
        newCompleted.add(key);
      } else {
        newCompleted.delete(key);
      }

      // Calculate new percentage
      const newPercent = totalLessonsRef.current > 0 
        ? Math.round((newCompleted.size / totalLessonsRef.current) * 100)
        : 0;

      const newState = {
        percent: newPercent,
        completed: newCompleted,
        syncing: true
      };

      // Save to cache
      saveCachedProgress(courseId, newState);

      return newState;
    });

    // If offline, queue the update
    if (!isOnlineRef.current) {
      const queuedUpdates = loadQueuedUpdates(courseId);
      queuedUpdates.push({
        moduleOrder,
        lessonOrder,
        completed,
        timestamp: Date.now()
      });
      saveQueuedUpdates(courseId, queuedUpdates);
      setProgressState(prev => ({ ...prev, syncing: false }));
      return;
    }

    // Try to sync with server
    try {
      const response = await progress.update({
        courseId,
        moduleOrder,
        lessonOrder,
        completed
      });

      const serverProgress = response.data;
      
      setProgressState({
        percent: serverProgress.percent,
        completed: new Set(serverProgress.completedLessonKeys),
        syncing: false
      });

      // Save to cache
      saveCachedProgress(courseId, {
        percent: serverProgress.percent,
        completed: new Set(serverProgress.completedLessonKeys),
        syncing: false
      });
    } catch (error) {
      
      // Revert optimistic update on error
      setProgressState(prev => {
        const newCompleted = new Set(prev.completed);
        
        if (completed) {
          newCompleted.delete(key);
        } else {
          newCompleted.add(key);
        }

        const newPercent = totalLessonsRef.current > 0 
          ? Math.round((newCompleted.size / totalLessonsRef.current) * 100)
          : 0;

        const revertedState = {
          percent: newPercent,
          completed: newCompleted,
          syncing: false
        };

        // Save reverted state to cache
        saveCachedProgress(courseId, revertedState);

        return revertedState;
      });

      // Show error toast (you might want to add a toast library)
    }
  }, [courseId]);

  // Check if a lesson is completed
  const isCompleted = useCallback((moduleOrder: number, lessonOrder: number): boolean => {
    const key = makeLessonKey(moduleOrder, lessonOrder);
    return progressState.completed.has(key);
  }, [progressState.completed]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress: progressState,
    toggle,
    isCompleted,
    refresh: loadProgress
  };
}
