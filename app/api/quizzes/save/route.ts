import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { QuizResponse } from '@/src/models/QuizResponse';
import { Course, IModule, ILesson, ILessonContent } from '@/src/models/Course';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/quizzes/save - Save quiz response
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { 
    courseId, 
    lessonId, 
    moduleOrder, 
    lessonOrder, 
    questionIndex, 
    selectedAnswerIndex 
  } = await req.json();

  // Validate required fields
  if (!courseId || lessonId === undefined || moduleOrder === undefined || 
      lessonOrder === undefined || questionIndex === undefined || 
      selectedAnswerIndex === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: courseId, lessonId, moduleOrder, lessonOrder, questionIndex, selectedAnswerIndex' },
      { status: 400 }
    );
  }

  // Validate types
  if (typeof moduleOrder !== 'number' || typeof lessonOrder !== 'number' || 
      typeof questionIndex !== 'number' || typeof selectedAnswerIndex !== 'number') {
    return NextResponse.json(
      { error: 'Invalid field types: moduleOrder, lessonOrder, questionIndex, and selectedAnswerIndex must be numbers' },
      { status: 400 }
    );
  }

  if (selectedAnswerIndex < 0 || selectedAnswerIndex > 3) {
    return NextResponse.json(
      { error: 'selectedAnswerIndex must be between 0 and 3' },
      { status: 400 }
    );
  }

  const userId = req.user.sub;

  // Verify course and lesson exist
  type CourseLean = {
    modules: Array<IModule & { lessons: Array<ILesson & { content?: ILessonContent }> }>;
  };

  const course = await Course.findOne({
    _id: courseId,
    userId: new mongoose.Types.ObjectId(userId),
  }).lean<CourseLean>();

  if (!course) {
    return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
  }

  // Find the lesson to get the correct answer
  const module = course.modules.find((m) => m.order === moduleOrder);
  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  const lesson = module.lessons.find((l) => l.order === lessonOrder);
  if (!lesson || !lesson.content || !lesson.content.quiz) {
    return NextResponse.json({ error: 'Lesson or quiz not found' }, { status: 404 });
  }

  const question = lesson.content.quiz.questions[questionIndex];
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Check if answer is correct
  const isCorrect = selectedAnswerIndex === question.answerIndex;
  const score = isCorrect ? 1 : 0;

  // Upsert quiz response
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
