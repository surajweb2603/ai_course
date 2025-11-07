import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import {
  bulkUpdateProgress,
  BulkProgressUpdateParams,
} from '@/src/server/services/progress.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/progress/bulk - Bulk update progress for multiple lessons
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json(
      { error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const { courseId, items } = await req.json();

  if (!courseId || !Array.isArray(items)) {
    return NextResponse.json(
      { error: 'Missing required fields: courseId (string), items (array)' },
      { status: 400 }
    );
  }

  // Validate items array
  for (const item of items) {
    if (
      typeof item.moduleOrder !== 'number' ||
      typeof item.lessonOrder !== 'number' ||
      typeof item.completed !== 'boolean'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid item format: each item must have moduleOrder (number), lessonOrder (number), completed (boolean)',
        },
        { status: 400 }
      );
    }
  }

  const params: BulkProgressUpdateParams = {
    userId: req.user.sub,
    courseId,
    items,
  };

  const result = await bulkUpdateProgress(params);

  return NextResponse.json({
    success: true,
    data: result,
  });
});
