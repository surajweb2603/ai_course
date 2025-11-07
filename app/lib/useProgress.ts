'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
} from 'react';
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

type SetProgressState = Dispatch<SetStateAction<ProgressState>>;

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
    // Ignore localStorage errors
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
    // Ignore localStorage errors
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
    // Ignore localStorage errors
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
    // Ignore localStorage errors
  }
}

/**
 * Clear queued updates from localStorage
 */
function clearQueuedUpdates(courseId: string): void {
  try {
    localStorage.removeItem(getOutboxKey(courseId));
  } catch (error) {
    // Ignore localStorage errors
  }
}

function calculateProgressState(
  completed: Set<string>,
  totalLessons: number,
  syncing: boolean
): ProgressState {
  const percent = totalLessons > 0 ? Math.round((completed.size / totalLessons) * 100) : 0;
  return {
    percent,
    completed,
    syncing,
  };
}

function mapServerProgress(serverProgress: any): ProgressState {
  return {
    percent: serverProgress.percent,
    completed: new Set(serverProgress.completedLessonKeys),
    syncing: false,
  };
}

function applyServerProgress(
  courseId: string,
  setProgressState: SetProgressState,
  serverProgress: any
): void {
  const newState = mapServerProgress(serverProgress);
  setProgressState(newState);
  saveCachedProgress(courseId, newState);
}

async function fetchProgressState(
  courseId: string,
  setProgressState: SetProgressState
): Promise<void> {
  try {
    setProgressState(prev => ({ ...prev, syncing: true }));
    const response = await progress.get(courseId);
    applyServerProgress(courseId, setProgressState, response.data);
  } catch (error) {
    const cached = loadCachedProgress(courseId);
    if (cached) {
      setProgressState(cached);
    } else {
      setProgressState(prev => ({ ...prev, syncing: false }));
    }
  }
}

async function processQueuedUpdates(
  courseId: string,
  setProgressState: SetProgressState
): Promise<void> {
  const queuedUpdates = loadQueuedUpdates(courseId);
  if (queuedUpdates.length === 0) {
    return;
  }

  try {
    setProgressState(prev => ({ ...prev, syncing: true }));
    const response = await progress.bulkUpdate({
      courseId,
      items: queuedUpdates.map(update => ({
        moduleOrder: update.moduleOrder,
        lessonOrder: update.lessonOrder,
        completed: update.completed,
      })),
    });
    applyServerProgress(courseId, setProgressState, response.data);
    clearQueuedUpdates(courseId);
  } catch (error) {
    setProgressState(prev => ({ ...prev, syncing: false }));
  }
}

function enqueueOfflineUpdate(
  courseId: string,
  moduleOrder: number,
  lessonOrder: number,
  completed: boolean,
  setProgressState: SetProgressState
): void {
  const queuedUpdates = loadQueuedUpdates(courseId);
  queuedUpdates.push({
    moduleOrder,
    lessonOrder,
    completed,
    timestamp: Date.now(),
  });
  saveQueuedUpdates(courseId, queuedUpdates);
  setProgressState(prev => ({ ...prev, syncing: false }));
}

function applyOptimisticUpdate(
  courseId: string,
  setProgressState: SetProgressState,
  moduleOrder: number,
  lessonOrder: number,
  completed: boolean,
  totalLessonsRef: MutableRefObject<number>
): void {
  const key = makeLessonKey(moduleOrder, lessonOrder);
  setProgressState(prev => {
    const newCompleted = new Set(prev.completed);
    if (completed) {
      newCompleted.add(key);
    } else {
      newCompleted.delete(key);
    }
    const newState = calculateProgressState(newCompleted, totalLessonsRef.current, true);
    saveCachedProgress(courseId, newState);
    return newState;
  });
}

function revertOptimisticUpdate(
  courseId: string,
  setProgressState: SetProgressState,
  moduleOrder: number,
  lessonOrder: number,
  completed: boolean,
  totalLessonsRef: MutableRefObject<number>
): void {
  const key = makeLessonKey(moduleOrder, lessonOrder);
  setProgressState(prev => {
    const newCompleted = new Set(prev.completed);
    if (completed) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }
    const revertedState = calculateProgressState(newCompleted, totalLessonsRef.current, false);
    saveCachedProgress(courseId, revertedState);
    return revertedState;
  });
}

function useTotalLessonsSync(
  totalLessons: number | undefined,
  totalLessonsRef: MutableRefObject<number>
): void {
  useEffect(() => {
    if (totalLessons !== undefined) {
      totalLessonsRef.current = totalLessons;
    }
  }, [totalLessons, totalLessonsRef]);
}

function useOnlineSync(
  courseId: string,
  flushQueuedUpdates: () => void,
  isOnlineRef: MutableRefObject<boolean>
): void {
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
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
  }, [courseId, flushQueuedUpdates, isOnlineRef]);
}

function useInitialLoadEffect(loadProgress: () => Promise<void>): void {
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);
}

/**
 * Hook for managing course progress with optimistic updates and offline support
 */
export function useProgress(courseId: string, totalLessons?: number): UseProgressReturn {
  const [progressState, setProgressState] = useState<ProgressState>({
    percent: 0,
    completed: new Set(),
    syncing: false,
  });

  const isOnlineRef = useRef(typeof window !== 'undefined' ? navigator.onLine : true);
  const totalLessonsRef = useRef(totalLessons || 0);

  if (!courseId) {
    return {
      progress: progressState,
      toggle: async () => {},
      isCompleted: () => false,
      refresh: async () => {},
    };
  }

  useTotalLessonsSync(totalLessons, totalLessonsRef);

  const loadProgress = useCallback(() => fetchProgressState(courseId, setProgressState), [courseId]);

  const flushQueuedUpdates = useCallback(() => {
    if (!isOnlineRef.current) {
      return;
    }
    return processQueuedUpdates(courseId, setProgressState);
  }, [courseId]);

  useOnlineSync(courseId, flushQueuedUpdates, isOnlineRef);
  useInitialLoadEffect(loadProgress);

  const updateLocalState = useCallback(
    (moduleOrder: number, lessonOrder: number, completed: boolean) => {
      applyOptimisticUpdate(
        courseId,
        setProgressState,
        moduleOrder,
        lessonOrder,
        completed,
        totalLessonsRef
      );
    },
    [courseId]
  );

  const queueOffline = useCallback(
    (moduleOrder: number, lessonOrder: number, completed: boolean) => {
      enqueueOfflineUpdate(courseId, moduleOrder, lessonOrder, completed, setProgressState);
    },
    [courseId]
  );

  const revertUpdate = useCallback(
    (moduleOrder: number, lessonOrder: number, completed: boolean) => {
      revertOptimisticUpdate(
        courseId,
        setProgressState,
        moduleOrder,
        lessonOrder,
        completed,
        totalLessonsRef
      );
    },
    [courseId]
  );

  const applyServer = useCallback(
    (serverProgress: any) => {
      applyServerProgress(courseId, setProgressState, serverProgress);
    },
    [courseId]
  );

  const toggle = useCallback(
    async (moduleOrder: number, lessonOrder: number, completed: boolean) => {
      updateLocalState(moduleOrder, lessonOrder, completed);

      if (!isOnlineRef.current) {
        queueOffline(moduleOrder, lessonOrder, completed);
        return;
      }

      try {
        const response = await progress.update({
          courseId,
          moduleOrder,
          lessonOrder,
          completed,
        });
        applyServer(response.data);
      } catch (error) {
        revertUpdate(moduleOrder, lessonOrder, completed);
      }
    },
    [courseId, updateLocalState, queueOffline, applyServer, revertUpdate]
  );

  const isCompleted = useCallback(
    (moduleOrder: number, lessonOrder: number) => {
      const key = makeLessonKey(moduleOrder, lessonOrder);
      return progressState.completed.has(key);
    },
    [progressState.completed]
  );

  return {
    progress: progressState,
    toggle,
    isCompleted,
    refresh: loadProgress,
  };
}
