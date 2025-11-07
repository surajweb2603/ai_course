import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import mongoose, { Schema } from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Old Course model schema (for backward compatibility)
const OldCourseSchema = new Schema(
  {
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
      default: 'not_started',
    },
  },
  { timestamps: true, collection: 'OldCourses' }
);

const OldCourseModel =
  mongoose.models.OldCourse || mongoose.model('OldCourse', OldCourseSchema);

// GET /api/dashboard/courses - Get user courses
export const GET = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.user.sub;
  const courses = await OldCourseModel.find({
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ updatedAt: -1 });

  // Format courses for frontend
  const formattedCourses = courses.map((course: any) => ({
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    progress: course.progress,
    lessonsCount: course.lessonsCount,
    estimatedTime: `${Math.round(course.estimatedTimeMinutes / 60)}h`,
    estimatedTimeMinutes: course.estimatedTimeMinutes,
    category: course.category,
    status: course.status,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }));

  return NextResponse.json({
    courses: formattedCourses,
  });
});
