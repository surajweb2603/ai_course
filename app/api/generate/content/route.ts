import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { Course, ICourse, IModule, ILesson } from '@/src/models/Course';
import { generateLessonContent } from '@/src/server/services/aiContent.service';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory rate limiting
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3000; // 3 seconds between requests

// POST /api/generate/content - Generate lesson content
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.user.sub;

  // Rate limiting check
  const lastRequest = rateLimitMap.get(userId);
  const now = Date.now();
  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few seconds before trying again.' },
      { status: 429 }
    );
  }
  rateLimitMap.set(userId, now);

  const { courseId, moduleOrder, lessonOrder, lessonId, audienceLevel } = await req.json();

  // Validate inputs
  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'courseId is required and must be a string' }, { status: 400 });
  }

  if (!moduleOrder || typeof moduleOrder !== 'number' || moduleOrder < 1) {
    return NextResponse.json({ error: 'moduleOrder is required and must be a positive number' }, { status: 400 });
  }

  if (lessonOrder !== undefined && (typeof lessonOrder !== 'number' || lessonOrder < 1)) {
    return NextResponse.json({ error: 'lessonOrder must be a positive number if provided' }, { status: 400 });
  }

  if (lessonId !== undefined && typeof lessonId !== 'string') {
    return NextResponse.json({ error: 'lessonId must be a string if provided' }, { status: 400 });
  }

  if (audienceLevel && !['beginner', 'intermediate', 'advanced'].includes(audienceLevel)) {
    return NextResponse.json(
      { error: 'audienceLevel must be one of: beginner, intermediate, advanced' },
      { status: 400 }
    );
  }

  // Load course and verify ownership
  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (course.userId.toString() !== userId) {
    return NextResponse.json({ error: 'You do not have permission to modify this course' }, { status: 403 });
  }

  // Find target module
  const modules = course.modules as unknown as Array<IModule & mongoose.Types.Subdocument>;
  const module = modules.find((m) => m.order === moduleOrder);
  if (!module) {
    return NextResponse.json({ error: `Module with order ${moduleOrder} not found` }, { status: 404 });
  }

  // Determine target lessons
  let targetLessons: Array<ILesson & mongoose.Types.Subdocument>;
  if (lessonOrder !== undefined || lessonId !== undefined) {
    const lesson = (module.lessons as unknown as Array<ILesson & mongoose.Types.Subdocument>).find((l) => {
      if (lessonId && l._id && l._id.toString() === lessonId) {
        return true;
      }
      if (lessonOrder !== undefined) {
        return l.order === lessonOrder;
      }
      return false;
    });
    if (!lesson) {
      return NextResponse.json(
        {
          error: lessonId
            ? `Lesson with id ${lessonId} not found in module ${moduleOrder}`
            : `Lesson with order ${lessonOrder} not found in module ${moduleOrder}`,
        },
        { status: 404 }
      );
    }
    targetLessons = [lesson];
  } else {
    targetLessons = module.lessons as unknown as Array<ILesson & mongoose.Types.Subdocument>;
  }

  if (targetLessons.length === 0) {
    return NextResponse.json({ error: 'No lessons found to generate content for' }, { status: 400 });
  }

  // Generate content for each target lesson
  let updatedCount = 0;
  const errors: string[] = [];

  for (const lesson of targetLessons) {
    try {
      const content = await generateLessonContent({
        courseTitle: course.title,
        language: course.language,
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        lessonSummary: lesson.summary,
        audienceLevel: audienceLevel || 'beginner',
        lessonId: lesson._id?.toString(),
      });

      // Update lesson content in course
      lesson.content = {
        theoryMd: content.theoryMd,
        exampleMd: content.exampleMd,
        exerciseMd: content.exerciseMd,
        keyTakeaways: content.keyTakeaways,
        media: content.media,
        quiz: content.quiz,
        estimatedMinutes: content.estimatedMinutes,
      };

      updatedCount++;
    } catch (error: any) {
      const errorMsg = `Failed for lesson "${lesson.title}": ${error.message}`;
      errors.push(errorMsg);
      
      if (error.message.includes('timeout') || error.message.includes('rate limit')) {
        await course.save();
        return NextResponse.json(
          {
            error: 'Request timeout or rate limit exceeded',
            message: error.message,
            updatedCount,
            partialSuccess: updatedCount > 0,
          },
          { status: 504 }
        );
      }
    }
  }

  // Save course with updated content
  await course.save();

  const response: any = {
    courseId: (course as ICourse & { _id: mongoose.Types.ObjectId })._id.toString(),
    moduleOrder,
    updatedCount,
  };

  if (lessonOrder !== undefined) {
    response.lessonOrder = lessonOrder;
  }
  if (lessonId !== undefined) {
    response.lessonId = lessonId;
  }

  if (errors.length > 0) {
    response.errors = errors;
    response.partialSuccess = true;
  }

  return NextResponse.json(response);
});
