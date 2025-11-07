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

interface GenerateContentBody {
  courseId: string;
  moduleOrder: number;
  lessonOrder?: number;
  lessonId?: string;
  audienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// POST /api/generate/content - Generate lesson content
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitError = applyRateLimit(req.user.sub);
  if (rateLimitError) {
    return rateLimitError;
  }

  const body = await parseRequestBody(req);
  if (body instanceof NextResponse) {
    return body;
  }

  const courseResult = await loadCourseForGeneration(
    body.courseId,
    req.user.sub
  );
  if (courseResult instanceof NextResponse) {
    return courseResult;
  }

  const moduleResult = findModuleByOrder(courseResult.course, body.moduleOrder);
  if (moduleResult instanceof NextResponse) {
    return moduleResult;
  }

  const lessonsResult = selectTargetLessons(moduleResult.module, body);
  if (lessonsResult instanceof NextResponse) {
    return lessonsResult;
  }

  const generationResult = await generateContentForLessons({
    course: courseResult.course,
    module: moduleResult.module,
    lessons: lessonsResult.lessons,
    audienceLevel: body.audienceLevel || 'beginner',
  });

  await courseResult.course.save();

  const responseBody = buildGenerationResponse({
    course: courseResult.course,
    body,
    result: generationResult,
  });

  if (generationResult.timeoutTriggered) {
    return NextResponse.json(responseBody, { status: 504 });
  }

  return NextResponse.json(responseBody);
});

function applyRateLimit(userId: string): NextResponse | null {
  const lastRequest = rateLimitMap.get(userId);
  const now = Date.now();

  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return NextResponse.json(
      {
        error:
          'Too many requests. Please wait a few seconds before trying again.',
      },
      { status: 429 }
    );
  }

  rateLimitMap.set(userId, now);
  return null;
}

/**
 * Validate course ID
 */
function validateCourseId(courseId: any): NextResponse | null {
  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json(
      { error: 'courseId is required and must be a string' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validate module order
 */
function validateModuleOrder(moduleOrder: any): NextResponse | null {
  if (!moduleOrder || typeof moduleOrder !== 'number' || moduleOrder < 1) {
    return NextResponse.json(
      { error: 'moduleOrder is required and must be a positive number' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validate lesson order
 */
function validateLessonOrder(lessonOrder: any): NextResponse | null {
  if (
    lessonOrder !== undefined &&
    (typeof lessonOrder !== 'number' || lessonOrder < 1)
  ) {
    return NextResponse.json(
      { error: 'lessonOrder must be a positive number if provided' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validate lesson ID
 */
function validateLessonId(lessonId: any): NextResponse | null {
  if (lessonId !== undefined && typeof lessonId !== 'string') {
    return NextResponse.json(
      { error: 'lessonId must be a string if provided' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validate audience level
 */
function validateAudienceLevel(audienceLevel: any): NextResponse | null {
  if (
    audienceLevel &&
    !['beginner', 'intermediate', 'advanced'].includes(audienceLevel)
  ) {
    return NextResponse.json(
      {
        error: 'audienceLevel must be one of: beginner, intermediate, advanced',
      },
      { status: 400 }
    );
  }
  return null;
}

async function parseRequestBody(
  req: NextRequest
): Promise<GenerateContentBody | NextResponse> {
  try {
    const body = (await req.json()) as GenerateContentBody;

    const courseIdError = validateCourseId(body.courseId);
    if (courseIdError) return courseIdError;

    const moduleOrderError = validateModuleOrder(body.moduleOrder);
    if (moduleOrderError) return moduleOrderError;

    const lessonOrderError = validateLessonOrder(body.lessonOrder);
    if (lessonOrderError) return lessonOrderError;

    const lessonIdError = validateLessonId(body.lessonId);
    if (lessonIdError) return lessonIdError;

    const audienceLevelError = validateAudienceLevel(body.audienceLevel);
    if (audienceLevelError) return audienceLevelError;

    return body;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

async function loadCourseForGeneration(
  courseId: string,
  userId: string
): Promise<
  | { course: ICourse & { _id: mongoose.Types.ObjectId; modules: unknown } }
  | NextResponse
> {
  const course = (await Course.findById(courseId)) as
    | (ICourse & { _id: mongoose.Types.ObjectId; modules: unknown })
    | null;

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (course.userId.toString() !== userId) {
    return NextResponse.json(
      { error: 'You do not have permission to modify this course' },
      { status: 403 }
    );
  }

  return { course };
}

function findModuleByOrder(
  course: ICourse & { modules: unknown },
  moduleOrder: number
): { module: IModule & mongoose.Types.Subdocument } | NextResponse {
  const modules = course.modules as unknown as Array<
    IModule & mongoose.Types.Subdocument
  >;
  const module = modules.find((m) => m.order === moduleOrder);

  if (!module) {
    return NextResponse.json(
      { error: `Module with order ${moduleOrder} not found` },
      { status: 404 }
    );
  }

  return { module };
}

function selectTargetLessons(
  module: IModule & mongoose.Types.Subdocument,
  body: GenerateContentBody
): { lessons: Array<ILesson & mongoose.Types.Subdocument> } | NextResponse {
  const lessons = module.lessons as unknown as Array<
    ILesson & mongoose.Types.Subdocument
  >;

  if (body.lessonOrder === undefined && !body.lessonId) {
    if (lessons.length === 0) {
      return NextResponse.json(
        { error: 'No lessons found to generate content for' },
        { status: 400 }
      );
    }
    return { lessons };
  }

  const lesson = lessons.find((l) => {
    if (body.lessonId && l._id && l._id.toString() === body.lessonId) {
      return true;
    }
    if (body.lessonOrder !== undefined) {
      return l.order === body.lessonOrder;
    }
    return false;
  });

  if (!lesson) {
    const errorMessage = body.lessonId
      ? `Lesson with id ${body.lessonId} not found in module ${body.moduleOrder}`
      : `Lesson with order ${body.lessonOrder} not found in module ${body.moduleOrder}`;

    return NextResponse.json({ error: errorMessage }, { status: 404 });
  }

  return { lessons: [lesson] };
}

async function generateContentForLessons({
  course,
  module,
  lessons,
  audienceLevel,
}: {
  course: ICourse & { title: string; language?: string };
  module: IModule & mongoose.Types.Subdocument;
  lessons: Array<ILesson & mongoose.Types.Subdocument>;
  audienceLevel: 'beginner' | 'intermediate' | 'advanced';
}): Promise<{
  updatedCount: number;
  errors: string[];
  timeoutTriggered: boolean;
  timeoutMessage?: string;
}> {
  let updatedCount = 0;
  const errors: string[] = [];

  for (const lesson of lessons) {
    try {
      const content = await generateLessonContent({
        courseTitle: course.title,
        language: course.language,
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        lessonSummary: lesson.summary,
        audienceLevel,
        lessonId: lesson._id?.toString(),
      });

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

      if (isTimeoutOrRateLimitError(error.message)) {
        return {
          updatedCount,
          errors,
          timeoutTriggered: true,
          timeoutMessage: error.message,
        };
      }
    }
  }

  return { updatedCount, errors, timeoutTriggered: false };
}

function isTimeoutOrRateLimitError(message: string): boolean {
  return message.includes('timeout') || message.includes('rate limit');
}

function buildGenerationResponse({
  course,
  body,
  result,
}: {
  course: ICourse & { _id: mongoose.Types.ObjectId };
  body: GenerateContentBody;
  result: {
    updatedCount: number;
    errors: string[];
    timeoutTriggered: boolean;
    timeoutMessage?: string;
  };
}): any {
  if (result.timeoutTriggered) {
    return {
      error: 'Request timeout or rate limit exceeded',
      message: result.timeoutMessage,
      updatedCount: result.updatedCount,
      partialSuccess: result.updatedCount > 0,
    };
  }

  const response: any = {
    courseId: course._id.toString(),
    moduleOrder: body.moduleOrder,
    updatedCount: result.updatedCount,
  };

  if (body.lessonOrder !== undefined) {
    response.lessonOrder = body.lessonOrder;
  }
  if (body.lessonId !== undefined) {
    response.lessonId = body.lessonId;
  }

  if (result.errors.length > 0) {
    response.errors = result.errors;
    response.partialSuccess = true;
  }

  return response;
}
