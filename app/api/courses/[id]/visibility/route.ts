import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { Course } from '@/src/models/Course';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH /api/courses/:id/visibility - Update course visibility
export const PATCH = withAuth(
  async (req: NextAuthRequest, { params }: { params: { id: string } }) => {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { visibility } = await req.json();
    const userId = req.user.sub;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Validate visibility value
    if (!['private', 'unlisted', 'public'].includes(visibility)) {
      return NextResponse.json(
        {
          error:
            'Invalid visibility value. Must be private, unlisted, or public',
        },
        { status: 400 }
      );
    }

    // Find course
    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Ownership check
    if (course.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update visibility
    course.visibility = visibility as 'private' | 'unlisted' | 'public';
    await course.save();

    return NextResponse.json({
      course: {
        _id: course._id,
        title: course.title,
        visibility: course.visibility,
      },
    });
  }
);
