import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import {
  upsertProgress,
  ProgressUpdateParams,
} from '@/src/server/services/progress.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/progress/update - Update progress for a single lesson
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json(
      { error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const { courseId, moduleOrder, lessonOrder, completed } = await req.json();

  if (
    !courseId ||
    moduleOrder === undefined ||
    lessonOrder === undefined ||
    completed === undefined
  ) {
    return NextResponse.json(
      {
        error:
          'Missing required fields: courseId, moduleOrder, lessonOrder, completed',
      },
      { status: 400 }
    );
  }

  // Validate types
  if (
    typeof moduleOrder !== 'number' ||
    typeof lessonOrder !== 'number' ||
    typeof completed !== 'boolean'
  ) {
    return NextResponse.json(
      {
        error:
          'Invalid field types: moduleOrder and lessonOrder must be numbers, completed must be boolean',
      },
      { status: 400 }
    );
  }

  const params: ProgressUpdateParams = {
    userId: req.user.sub,
    courseId,
    moduleOrder,
    lessonOrder,
    completed,
  };

  const result = await upsertProgress(params);

  return NextResponse.json({
    success: true,
    data: result,
  });
});
