import { Types } from 'mongoose';
import { Progress, IProgress } from '../../models/Progress';
import { Course, ICourse } from '../../models/Course';
import UserStats from '../../models/UserStats';

export interface ProgressUpdateParams {
  userId: string;
  courseId: string;
  moduleOrder: number;
  lessonOrder: number;
  completed: boolean;
}

export interface ProgressResult {
  percent: number;
  completedLessonKeys: string[];
}

export interface BulkProgressUpdateParams {
  userId: string;
  courseId: string;
  items: Array<{
    moduleOrder: number;
    lessonOrder: number;
    completed: boolean;
  }>;
}

/**
 * Generate a lesson key from module and lesson order
 */
export function makeLessonKey(moduleOrder: number, lessonOrder: number): string {
  return `${moduleOrder}:${lessonOrder}`;
}

/**
 * Update learning streak when a course is completed
 */
async function updateLearningStreak(userId: string): Promise<void> {
  try {
    
    // Handle both string and ObjectId formats
    const userIdObj = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    
    let userStats = await UserStats.findOne({ userId: userIdObj });

    if (!userStats) {
      userStats = await UserStats.create({
        userId: userIdObj,
        currentStreak: 1,
        lastActivityDate: new Date(),
      });
    } else {
      const today = new Date();
      const lastActivity = new Date(userStats.lastActivityDate);
      
      // Reset time to compare only dates
      today.setHours(0, 0, 0, 0);
      lastActivity.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day - update lastActivityDate but keep streak the same
        userStats.lastActivityDate = new Date();
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        userStats.currentStreak += 1;
        userStats.lastActivityDate = new Date();
      } else {
        // Streak broken, reset to 1
        userStats.currentStreak = 1;
        userStats.lastActivityDate = new Date();
      }
      
      await userStats.save();
    }
  } catch (error) {
    // Don't throw error to avoid breaking progress updates
  }
}

/**
 * Compute completion percentage for a course
 */
export function computePercent(course: ICourse, completedKeys: string[]): number {
  // Calculate total lessons across all modules
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  
  // Guard against division by zero
  if (totalLessons === 0) {
    return 0;
  }
  
  // Count unique completed lesson keys that exist in the course
  const completedCount = completedKeys.filter(key => {
    const [moduleOrderStr, lessonOrderStr] = key.split(':');
    const moduleOrder = parseInt(moduleOrderStr);
    const lessonOrder = parseInt(lessonOrderStr);
    
    // Check if this lesson actually exists in the course
    const module = course.modules.find(m => m.order === moduleOrder);
    if (!module) return false;
    
    const lesson = module.lessons.find(l => l.order === lessonOrder);
    return !!lesson;
  }).length;
  
  return Math.round((completedCount / totalLessons) * 100);
}

/**
 * Upsert progress for a single lesson
 */
export async function upsertProgress({
  userId,
  courseId,
  moduleOrder,
  lessonOrder,
  completed
}: ProgressUpdateParams): Promise<ProgressResult> {
  // Load course to validate lesson exists and check ownership
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  
  // Validate that the lesson exists in the course
  const module = course.modules.find(m => m.order === moduleOrder);
  if (!module) {
    throw new Error(`Module ${moduleOrder} not found in course`);
  }
  
  const lesson = module.lessons.find(l => l.order === lessonOrder);
  if (!lesson) {
    throw new Error(`Lesson ${lessonOrder} not found in module ${moduleOrder}`);
  }
  
  // For now, we'll allow progress tracking for any user
  // In the future, you might want to add enrollment checks here
  
  // Find or create progress document
  let progress = await Progress.findOne({ userId, courseId });
  if (!progress) {
    progress = new Progress({
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      completedLessonKeys: [],
      percent: 0
    });
  }
  
  // Generate lesson key
  const key = makeLessonKey(moduleOrder, lessonOrder);
  
  // Update completed lessons set
  if (completed) {
    // Add key if not already present (set semantics)
    if (!progress.completedLessonKeys.includes(key)) {
      progress.completedLessonKeys.push(key);
    }
  } else {
    // Remove key if present
    progress.completedLessonKeys = progress.completedLessonKeys.filter(k => k !== key);
  }
  
  // Recompute percentage
  const oldPercent = progress.percent;
  progress.percent = computePercent(course, progress.completedLessonKeys);
  
  // Save progress
  await progress.save();
  
  // Update learning streak when a lesson is completed (not just when course reaches 100%)
  if (completed) {
    await updateLearningStreak(userId);
  } else {
  }
  
  return {
    percent: progress.percent,
    completedLessonKeys: [...progress.completedLessonKeys]
  };
}

/**
 * Get progress for a user and course
 */
export async function getProgress(userId: string, courseId: string): Promise<ProgressResult> {
  const progress = await Progress.findOne({ userId, courseId });
  
  if (!progress) {
    return {
      percent: 0,
      completedLessonKeys: []
    };
  }
  
  return {
    percent: progress.percent,
    completedLessonKeys: [...progress.completedLessonKeys]
  };
}

/**
 * Bulk update progress for multiple lessons
 */
export async function bulkUpdateProgress({
  userId,
  courseId,
  items
}: BulkProgressUpdateParams): Promise<ProgressResult> {
  // Load course to validate lessons exist
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  
  // Validate all lessons exist in the course
  for (const item of items) {
    const module = course.modules.find(m => m.order === item.moduleOrder);
    if (!module) {
      throw new Error(`Module ${item.moduleOrder} not found in course`);
    }
    
    const lesson = module.lessons.find(l => l.order === item.lessonOrder);
    if (!lesson) {
      throw new Error(`Lesson ${item.lessonOrder} not found in module ${item.moduleOrder}`);
    }
  }
  
  // Find or create progress document
  let progress = await Progress.findOne({ userId, courseId });
  if (!progress) {
    progress = new Progress({
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      completedLessonKeys: [],
      percent: 0
    });
  }
  
  // Apply all updates
  let hasCompletedLessons = false;
  for (const item of items) {
    const key = makeLessonKey(item.moduleOrder, item.lessonOrder);
    
    if (item.completed) {
      // Add key if not already present
      if (!progress.completedLessonKeys.includes(key)) {
        progress.completedLessonKeys.push(key);
        hasCompletedLessons = true;
      }
    } else {
      // Remove key if present
      progress.completedLessonKeys = progress.completedLessonKeys.filter(k => k !== key);
    }
  }
  
  // Recompute percentage
  const oldPercent = progress.percent;
  progress.percent = computePercent(course, progress.completedLessonKeys);
  
  // Save progress
  await progress.save();
  
  // Update learning streak when lessons are completed (not just when course reaches 100%)
  if (hasCompletedLessons) {
    await updateLearningStreak(userId);
  } else {
  }
  
  return {
    percent: progress.percent,
    completedLessonKeys: [...progress.completedLessonKeys]
  };
}

/**
 * Get progress for multiple courses
 */
export async function getProgressForCourses(userId: string, courseIds: string[]): Promise<Record<string, ProgressResult>> {
  const progressDocs = await Progress.find({ 
    userId, 
    courseId: { $in: courseIds } 
  });
  
  const result: Record<string, ProgressResult> = {};
  
  // Initialize all courses with default progress
  for (const courseId of courseIds) {
    result[courseId] = {
      percent: 0,
      completedLessonKeys: []
    };
  }
  
  // Fill in actual progress data
  for (const progress of progressDocs) {
    result[progress.courseId.toString()] = {
      percent: progress.percent,
      completedLessonKeys: [...progress.completedLessonKeys]
    };
  }
  
  return result;
}
