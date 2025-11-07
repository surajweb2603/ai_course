import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import {
  generateChatResponse,
  ChatRequest,
  ChatContext,
} from '@/src/server/services/aiChat.service';
import { Course, IModule, ILesson } from '@/src/models/Course';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/chat - Generate AI tutor response
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const {
    message,
    courseId,
    moduleTitle,
    lessonTitle,
    conversationHistory,
    language,
  } = await req.json();

  if (!message || !courseId) {
    return NextResponse.json(
      { error: 'Message and courseId are required' },
      { status: 400 }
    );
  }

  // Fetch course details for context
  const course = await Course.findById(courseId)
    .select('title modules')
    .lean<{ title: string; modules: IModule[] }>();
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Find lesson content if module and lesson are specified
  let lessonContent = '';
  if (moduleTitle && lessonTitle && Array.isArray(course.modules)) {
    const module = course.modules.find((m: IModule) => m.title === moduleTitle);
    if (module && Array.isArray(module.lessons)) {
      const lesson = module.lessons.find(
        (l: ILesson) => l.title === lessonTitle
      );
      if (lesson && lesson.content) {
        lessonContent = lesson.content.theoryMd || '';
      }
    }
  }

  // Build chat context
  const context: ChatContext = {
    courseId,
    courseTitle: course.title,
    moduleTitle,
    lessonTitle,
    lessonContent,
    language: language || 'en',
  };

  // Prepare chat request
  const chatRequest: ChatRequest = {
    message,
    context,
    conversationHistory: conversationHistory || [],
  };

  // Generate AI response
  const response = await generateChatResponse(chatRequest);

  return NextResponse.json({
    success: true,
    data: {
      message: response.message,
      timestamp: response.timestamp,
      provider: response.provider,
    },
  });
});
