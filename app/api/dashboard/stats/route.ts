import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import mongoose, { Schema } from 'mongoose';
import UserStats from '@/src/models/UserStats';
import { Course, IModule } from '@/src/models/Course';
import { Progress } from '@/src/models/Progress';
import { Certificate } from '@/src/models/Certificate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

// GET /api/dashboard/stats - Get user dashboard statistics
export const GET = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.user.sub;

  // Get or create user stats
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
  const oldCourses = await OldCourseModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 });
  type CourseForStats = {
    _id: mongoose.Types.ObjectId;
    modules: IModule[];
  };

  const newCourses = await Course.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .lean<CourseForStats[]>();

  // Calculate statistics from old courses
  const oldCoursesCreated = oldCourses.length;
  const completedOldCourses = oldCourses.filter((c: any) => c.status === 'completed').length;
  
  // Calculate statistics from new courses using progress data
  const newCoursesCreated = newCourses.length;
  let completedNewCourses = 0;
  let totalNewCourseProgress = 0;
  let totalNewLearningTimeMinutes = 0;
  
  for (const course of newCourses) {
    const progress = await Progress.findOne({ 
      userId: new mongoose.Types.ObjectId(userId), 
      courseId: course._id 
    }).lean<{ percent: number }>();
    if (progress && progress.percent === 100) {
      completedNewCourses++;
    }
    totalNewCourseProgress += progress ? progress.percent : 0;
    
    // Calculate learning time
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
  
  // Get certificates earned
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
  
  // Calculate achievements based on certificates
  let achievements = certificatesEarned;

  // Update stats if they've changed
  if (
    userStats.coursesCreated !== coursesCreated ||
    userStats.completionRate !== completionRate ||
    userStats.learningTimeMinutes !== totalLearningTimeMinutes ||
    userStats.achievements !== achievements
  ) {
    userStats.coursesCreated = coursesCreated;
    userStats.completionRate = completionRate;
    userStats.learningTimeMinutes = totalLearningTimeMinutes;
    userStats.achievements = achievements;
    await userStats.save();
  }

  // Format learning time
  const learningTimeHours = Math.floor(totalLearningTimeMinutes / 60);
  const learningTimeMinutesRemainder = totalLearningTimeMinutes % 60;
  const learningTimeFormatted = learningTimeHours > 0 
    ? `${learningTimeHours}h${learningTimeMinutesRemainder > 0 ? ` ${learningTimeMinutesRemainder}m` : ''}`
    : `${learningTimeMinutesRemainder}m`;

  return NextResponse.json({
    stats: {
      coursesCreated,
      learningTime: learningTimeFormatted,
      learningTimeMinutes: totalLearningTimeMinutes,
      completionRate,
      achievements: userStats.achievements,
      currentStreak: userStats.currentStreak,
    },
  });
});
