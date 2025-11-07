
import mongoose, { Schema } from 'mongoose';
import UserStats from '@/src/models/UserStats';
import { Course, IModule } from '@/src/models/Course';
import { Progress } from '@/src/models/Progress';
import { Certificate } from '@/src/models/Certificate';

// Old Course model schema (for backward compatibility)
const OldCourseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  lessonsCount: { type: Number, default: 10 },
  estimatedTimeMinutes: { type: Number, default: 300 },
  category: { type: String, default: 'General' },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'not_started' 
  },
}, { timestamps: true, collection: 'OldCourses' });

const OldCourseModel = mongoose.models.OldCourse || mongoose.model('OldCourse', OldCourseSchema);

// Helper function to update user achievements
export async function updateUserAchievements(userId: string): Promise<void> {
  try {
    // Get user stats
    let userStats = await UserStats.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!userStats) {
      userStats = await UserStats.create({
        userId: new mongoose.Types.ObjectId(userId),
        coursesCreated: 0,
        learningTimeMinutes: 0,
        completionRate: 0,
        achievements: 0,
        currentStreak: 0,
        lastActivityDate: new Date(),
      });
    }

    // Get user courses (both old and new courses)
    const oldCourses = await OldCourseModel.find({ userId: new mongoose.Types.ObjectId(userId) });
    type CourseForStats = {
      _id: mongoose.Types.ObjectId;
      modules: IModule[];
    };

    const newCourses = await Course.find({ userId: new mongoose.Types.ObjectId(userId) }).lean<CourseForStats[]>();

    // Calculate statistics
    const oldCoursesCreated = oldCourses.length;
    const completedOldCourses = oldCourses.filter((c: any) => c.status === 'completed').length;
    
    const newCoursesCreated = newCourses.length;
    let completedNewCourses = 0;
    let totalNewLearningTimeMinutes = 0;
    
    for (const course of newCourses) {
      const progress = await Progress.findOne({ 
        userId: new mongoose.Types.ObjectId(userId), 
        courseId: course._id 
      }).lean<{ percent: number }>();
      if (progress && progress.percent === 100) {
        completedNewCourses++;
      }
      
      // Calculate learning time for this specific course
      const courseLessons = course.modules.reduce(
        (moduleSum: number, module: IModule) => moduleSum + (module.lessons?.length ?? 0),
        0
      );
      const courseProgress = progress ? progress.percent : 0;
      const courseLearningTime = Math.round((courseProgress / 100) * courseLessons * 30);
      totalNewLearningTimeMinutes += courseLearningTime;
    }
    
    // Calculate total learning time from old courses
    const totalOldLearningTimeMinutes = oldCourses.reduce((sum: number, course: any) => {
      return sum + Math.round((course.estimatedTimeMinutes * course.progress) / 100);
    }, 0);
    
    // Get certificates earned (this is what counts for achievements)
    const certificatesEarned = await Certificate.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    // Combined statistics
    const coursesCreated = oldCoursesCreated + newCoursesCreated;
    const completedCourses = completedOldCourses + completedNewCourses;
    const completionRate = coursesCreated > 0 
      ? Math.round((completedCourses / coursesCreated) * 100) 
      : 0;
    const totalLearningTimeMinutes = totalOldLearningTimeMinutes + totalNewLearningTimeMinutes;
    
    // Calculate achievements based on certificates earned
    // Each certificate = 1 achievement (ONLY certificates count)
    let achievements = certificatesEarned;

    // Update user stats
    userStats.coursesCreated = coursesCreated;
    userStats.completionRate = completionRate;
    userStats.learningTimeMinutes = totalLearningTimeMinutes;
    userStats.achievements = achievements;
    await userStats.save();
  } catch (error) {
    // Silently fail - don't throw errors for achievement updates
  }
}
