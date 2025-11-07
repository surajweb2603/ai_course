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
    { params }: { params: { courseId: string } }
  ) => {
    if (!req.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { courseId } = params;
    const userId = req.user.sub;

    try {
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
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificate-${courseId}.pdf"`,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to generate certificate' },
        { status: 400 }
      );
    }
  }
);
