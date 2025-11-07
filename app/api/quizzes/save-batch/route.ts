import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { QuizResponse } from '@/src/models/QuizResponse';
import { Course, IModule, ILesson, ILessonContent } from '@/src/models/Course';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/quizzes/save-batch - Save multiple quiz responses at once
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json(
      { error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const { courseId, lessonId, responses } = await req.json();

  if (!courseId || !lessonId || !Array.isArray(responses)) {
    return NextResponse.json(
      {
        error: 'Missing required fields: courseId, lessonId, responses (array)',
      },
      { status: 400 }
    );
  }

  const userId = req.user.sub;

  // Verify course exists
  type CourseLean = {
    modules: Array<
      IModule & { lessons: Array<ILesson & { content?: ILessonContent }> }
    >;
  };

  const course = await Course.findOne({
    _id: courseId,
    userId: new mongoose.Types.ObjectId(userId),
  }).lean<CourseLean>();

  if (!course) {
    return NextResponse.json(
      { error: 'Course not found or access denied' },
      { status: 404 }
    );
  }

  // Process each response
  const savedResponses: any[] = [];
  for (const response of responses) {
    const { moduleOrder, lessonOrder, questionIndex, selectedAnswerIndex } =
      response;

    if (
      moduleOrder === undefined ||
      lessonOrder === undefined ||
      questionIndex === undefined ||
      selectedAnswerIndex === undefined
    ) {
      continue; // Skip invalid responses
    }

    // Find the lesson to get the correct answer
    const module = course.modules.find((m) => m.order === moduleOrder);
    if (!module) continue;

    const lesson = module.lessons.find((l) => l.order === lessonOrder);
    if (!lesson || !lesson.content || !lesson.content.quiz) continue;

    const question = lesson.content.quiz.questions[questionIndex];
    if (!question) continue;

    const isCorrect = selectedAnswerIndex === question.answerIndex;
    const score = isCorrect ? 1 : 0;

    const quizResponse = await QuizResponse.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(courseId),
        lessonId: new mongoose.Types.ObjectId(lessonId),
        questionIndex,
      },
      {
        userId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(courseId),
        lessonId: new mongoose.Types.ObjectId(lessonId),
        moduleOrder,
        lessonOrder,
        questionIndex,
        selectedAnswerIndex,
        isCorrect,
        score,
        completedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    savedResponses.push(quizResponse);
  }

  return NextResponse.json({
    success: true,
    data: savedResponses,
  });
});
