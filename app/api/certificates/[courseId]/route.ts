import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import {
  ensureEligible,
  upsertCertificate,
} from '@/src/server/services/certificate.service';
import { buildCertificatePDF } from '@/src/server/services/certificateTemplate.service';
import { updateUserAchievements } from '@/src/server/services/dashboard.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/certificates/:courseId - Download certificate for a completed course
export const GET = withAuth(
  async (
    req: NextAuthRequest,
    context: { params: Promise<{ courseId: string }> | { courseId: string } }
  ) => {
    if (!req.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle params as Promise (Next.js 14.2+)
    const params = await Promise.resolve(context.params);
    const { courseId } = params;
    const userId = req.user.sub;

    // Validate courseId format
    if (!courseId || !courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    try {
      // Check if user has a paid plan
      if (req.user.plan === 'free') {
        return NextResponse.json(
          { error: 'Certificate download is only available for paid plans. Please upgrade to download certificates.' },
          { status: 403 }
        );
      }

      // Check eligibility and get user/course data
      const { user, course } = await ensureEligible(userId, courseId);

      // Create or get existing certificate
      const certificate = await upsertCertificate(user, course);

      // Update achievements when certificate is generated
      await updateUserAchievements(userId);

      // Generate PDF using template
      const pdfBytes = await buildCertificatePDF({
        user,
        course,
        cert: certificate,
      });

      // Return PDF as response
      // Convert Uint8Array to ArrayBuffer for NextResponse compatibility
      const arrayBuffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(arrayBuffer).set(pdfBytes);
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificate-${courseId}.pdf"`,
        },
      });
    } catch (error: any) {
      console.error('Certificate generation error:', {
        courseId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      
      // Return appropriate status codes based on error type
      const statusCode = error.message?.includes('not found') ? 404
        : error.message?.includes('Unauthorized') ? 403
        : error.message?.includes('not available') ? 400
        : 500;
      
      return NextResponse.json(
        { error: error.message || 'Failed to generate certificate' },
        { status: statusCode }
      );
    }
  }
);
