import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { generateCourseOutline } from '@/src/server/services/ai.service';
import { Course, ICourse } from '@/src/models/Course';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory rate limiter per user
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds

// POST /api/generate/outline - Generate course outline
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.user.sub;

  // Rate limiting check
  const lastRequest = rateLimitMap.get(userId);
  const now = Date.now();
  
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequest)) / 1000);
    return NextResponse.json(
      { error: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.` },
      { status: 429 }
    );
  }

  // Update rate limit timestamp
  rateLimitMap.set(userId, now);

  const { topic, language, subtopics, courseId } = await req.json();

  // Check free user course limit (only for new course creation)
  if (!courseId && req.user.plan === 'free') {
    const existingCoursesCount = await Course.countDocuments({ userId });
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

  // Check free user module limit (for existing courses)
  if (courseId && req.user.plan === 'free') {
    const course = await Course.findOne({
      _id: courseId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    
    if (course && course.modules.length >= 2) {
      return NextResponse.json(
        {
          error: 'Upgrade your plan to add more modules and lessons.',
          upgradeRequired: true,
          currentPlan: 'free',
          limit: '2 modules maximum per course',
        },
        { status: 403 }
      );
    }
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }

  if (topic.trim().length > 200) {
    return NextResponse.json({ error: 'Topic must be 200 characters or less' }, { status: 400 });
  }

  // Validate subtopics if provided
  let subtopicsArray: string[] = [];
  if (subtopics) {
    if (Array.isArray(subtopics)) {
      subtopicsArray = subtopics
        .filter(s => typeof s === 'string' && s.trim().length > 0)
        .map(s => s.trim().substring(0, 100));
    } else if (typeof subtopics === 'string') {
      subtopicsArray = subtopics
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.substring(0, 100));
    }
    
    if (subtopicsArray.length > 5) {
      return NextResponse.json(
        { error: 'Too many subtopics. Please select a maximum of 5 subtopics to keep the prompt manageable.' },
        { status: 400 }
      );
    }
    
    const totalLength = subtopicsArray.join(', ').length;
    if (totalLength > 300) {
      return NextResponse.json(
        { error: 'Subtopics are too long. Please use shorter subtopic names or select fewer subtopics (maximum combined length: 300 characters).' },
        { status: 400 }
      );
    }
  }

  // Set a timeout for the entire operation
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 15000); // 15 seconds
  });

  // Generate outline with timeout
  const generatePromise = (async () => {
    const outline = await generateCourseOutline({
      topic: topic.trim(),
      language: language || 'en',
      subtopics: subtopicsArray,
      userPlan: req.user!.plan,
    });

    let course;

    if (courseId) {
      // Update existing course
      course = await Course.findOne({
        _id: courseId,
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!course) {
        throw new Error('Course not found or you do not have permission to update it');
      }

      course.title = outline.title;
      course.language = outline.language;
      course.summary = outline.summary;
      course.modules = outline.modules.map(m => ({
        _id: new mongoose.Types.ObjectId(),
        order: m.order,
        title: m.title,
        lessons: m.lessons.map(l => ({
          _id: new mongoose.Types.ObjectId(),
          order: l.order,
          title: l.title,
          content: undefined,
        })),
      }));

      await course.save();
    } else {
      // Create new course
      course = new Course({
        userId: new mongoose.Types.ObjectId(userId),
        title: outline.title,
        language: outline.language,
        summary: outline.summary,
        visibility: 'private',
        modules: outline.modules.map(m => ({
          _id: new mongoose.Types.ObjectId(),
          order: m.order,
          title: m.title,
          lessons: m.lessons.map(l => ({
            _id: new mongoose.Types.ObjectId(),
            order: l.order,
            title: l.title,
            content: undefined,
          })),
        })),
      });

      await course.save();
    }

    return { course, outline };
  })();

  try {
    const result = await Promise.race([generatePromise, timeoutPromise]) as Awaited<typeof generatePromise>;
    const { course, outline } = result;

    return NextResponse.json({
      courseId: (course as ICourse & { _id: mongoose.Types.ObjectId })._id.toString(),
      outline: {
        title: outline.title,
        language: outline.language,
        summary: outline.summary,
        modules: outline.modules,
      },
    });
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'The request took too long to process. Please try again with a simpler topic.' },
        { status: 504 }
      );
    }

    if (error.message === 'No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY in the project .env file.') {
      return NextResponse.json(
        { error: 'AI service is not configured. Please ensure OPENAI_API_KEY is set in the project .env file.' },
        { status: 503 }
      );
    }

    if (error.message.includes('quota exceeded') || error.message.includes('rate limit')) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error.status === 401 || error.message.includes('Incorrect API key') || error.message.includes('invalid api key')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in the project .env file.' },
        { status: 401 }
      );
    }

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate course outline' },
      { status: 500 }
    );
  }
});
