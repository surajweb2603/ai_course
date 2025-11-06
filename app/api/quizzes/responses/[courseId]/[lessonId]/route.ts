import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { QuizResponse } from '@/src/models/QuizResponse';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/quizzes/responses/:courseId/:lessonId - Get quiz responses for a lesson
export const GET = withAuth(async (
  req: NextAuthRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) => {
  if (!req.user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { courseId, lessonId } = params;

  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: 'Missing required parameters: courseId, lessonId' },
      { status: 400 }
    );
  }

  const userId = req.user.sub;

  // Get all quiz responses for this lesson
  const responses = await QuizResponse.find({
    userId: new mongoose.Types.ObjectId(userId),
    courseId: new mongoose.Types.ObjectId(courseId),
    lessonId: new mongoose.Types.ObjectId(lessonId),
  }).sort({ questionIndex: 1 });

  return NextResponse.json({
    success: true,
    data: responses,
  });
});
