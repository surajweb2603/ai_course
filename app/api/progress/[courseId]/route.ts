import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { getProgress } from '@/src/server/services/progress.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/progress/:courseId - Get progress for a specific course
export const GET = withAuth(
  async (
    req: NextAuthRequest,
    { params }: { params: { courseId: string } }
  ) => {
    if (!req.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { courseId } = params;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const result = await getProgress(req.user.sub, courseId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);
