import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { QuizResponse } from '@/src/models/QuizResponse';
import { Course, IModule, ILesson, ILessonContent } from '@/src/models/Course';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Validate quiz save request
 */
function validateQuizSaveRequest(data: any): { error?: string } {
  const {
    courseId,
    lessonId,
    moduleOrder,
    lessonOrder,
    questionIndex,
    selectedAnswerIndex,
  } = data;

  if (
    !courseId ||
    lessonId === undefined ||
    moduleOrder === undefined ||
    lessonOrder === undefined ||
    questionIndex === undefined ||
    selectedAnswerIndex === undefined
  ) {
    return {
      error:
        'Missing required fields: courseId, lessonId, moduleOrder, lessonOrder, questionIndex, selectedAnswerIndex',
    };
  }

  if (
    typeof moduleOrder !== 'number' ||
    typeof lessonOrder !== 'number' ||
    typeof questionIndex !== 'number' ||
    typeof selectedAnswerIndex !== 'number'
  ) {
    return {
      error:
        'Invalid field types: moduleOrder, lessonOrder, questionIndex, and selectedAnswerIndex must be numbers',
    };
  }

  if (selectedAnswerIndex < 0 || selectedAnswerIndex > 3) {
    return { error: 'selectedAnswerIndex must be between 0 and 3' };
  }

  return {};
}

/**
 * Find lesson and question by course, module, and lesson order
 */
async function findLessonAndQuestion(
  courseId: string,
  userId: string,
  moduleOrder: number,
  lessonOrder: number,
  questionIndex: number
): Promise<{ error?: string; question?: any }> {
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
    return { error: 'Course not found or access denied' };
  }

  const module = course.modules.find((m) => m.order === moduleOrder);
  if (!module) {
    return { error: 'Module not found' };
  }

  const lesson = module.lessons.find((l) => l.order === lessonOrder);
  if (!lesson || !lesson.content || !lesson.content.quiz) {
    return { error: 'Lesson or quiz not found' };
  }

  const question = lesson.content.quiz.questions[questionIndex];
  if (!question) {
    return { error: 'Question not found' };
  }

  return { question };
}

// POST /api/quizzes/save - Save quiz response
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json(
      { error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const data = await req.json();
  const validation = validateQuizSaveRequest(data);
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const {
    courseId,
    lessonId,
    moduleOrder,
    lessonOrder,
    questionIndex,
    selectedAnswerIndex,
  } = data;

  const userId = req.user.sub;

  const lessonResult = await findLessonAndQuestion(
    courseId,
    userId,
    moduleOrder,
    lessonOrder,
    questionIndex
  );

  if (lessonResult.error) {
    const status = lessonResult.error.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: lessonResult.error }, { status });
  }

  const question = lessonResult.question!;
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

  return NextResponse.json({
    success: true,
    data: {
      quizResponse,
      isCorrect,
      correctAnswerIndex: question.answerIndex,
    },
  });
});
