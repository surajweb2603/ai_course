import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { Course, ICourse } from '@/src/models/Course';
import { Progress } from '@/src/models/Progress';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/courses - Create a new course
export const POST = withAuth(async (req: NextAuthRequest) => {
  const { title, language } = await req.json();

  // Validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (title.trim().length > 180) {
    return NextResponse.json(
      { error: 'Title must be 180 characters or less' },
      { status: 400 }
    );
  }

  // Check free user course limit
  if (req.user!.plan === 'free') {
    const existingCoursesCount = await Course.countDocuments({ userId: req.user!.sub });
    if (existingCoursesCount >= 1) {
      return NextResponse.json(
        {
          error: 'Upgrade your plan to add more modules and lessons.',
          upgradeRequired: true,
          currentPlan: 'free',
          limit: '1 course maximum',
        },
        { status: 403 }
      );
    }
  }

  // Create empty course shell
  const course = await Course.create({
    userId: req.user!.sub,
    title: title.trim(),
    language: language || 'en',
    modules: [],
  });

  return NextResponse.json({ course }, { status: 201 });
});

// GET /api/courses - List all courses for current user
export const GET = withAuth(async (req: NextAuthRequest) => {
  const userId = req.user!.sub;

  // Fetch all courses for the user
  type CourseListItem = {
    _id: Types.ObjectId;
    title: string;
    language: string;
    visibility: ICourse['visibility'];
    createdAt: Date;
    updatedAt: Date;
  };

  const courses = await Course.find({ userId })
    .select('_id title language visibility createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean<CourseListItem[]>();

  // Fetch progress for all courses
  const courseIds = courses.map((c) => c._id);
  type ProgressSummary = {
    courseId: Types.ObjectId;
    percent: number;
  };

  const progressDocs = await Progress.find({
    userId,
    courseId: { $in: courseIds },
  }).lean<ProgressSummary[]>();

  // Map progress to courses
  const progressMap = new Map<string, number>(
    progressDocs.map((p) => [p.courseId.toString(), p.percent ?? 0])
  );

  const coursesWithProgress = courses.map((course) => ({
    ...course,
    percent: progressMap.get(course._id.toString()) || 0,
  }));

  return NextResponse.json(coursesWithProgress);
});
