import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import { Certificate } from '@/src/models/Certificate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function shouldReturnHtml(req: NextRequest): boolean {
  const acceptHeader = req.headers.get('accept');
  if (!acceptHeader) {
    return false;
  }

  const wantsHtml = acceptHeader.includes('text/html');
  const wantsExplicitJson = acceptHeader.includes('application/json');

  return wantsHtml && !wantsExplicitJson;
}

// Helper function to format date
function formatDate(dateString: Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateVerificationHTML(data: {
  valid: boolean;
  certificate: {
    name: string;
    courseTitle: string;
    issuedAt: Date;
    code: string;
  };
  user: any;
  course: any;
  error?: string;
  code?: string;
}): string {
  if (!data.valid || data.error) {
    return renderVerificationError(data);
  }

  return renderVerificationSuccess(data);
}

function renderVerificationError(data: {
  error?: string;
  code?: string;
}): string {
  const codeBlock = data.code
    ? `
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <p class="text-sm text-gray-500 mb-1">Certificate Code</p>
            <p class="text-lg font-mono font-semibold text-gray-900">${data.code}</p>
        </div>
        `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Verification - AiCourse Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-3">Certificate Not Found</h1>
        <p class="text-gray-600 mb-6">${data.error || 'The certificate code you entered is invalid or does not exist.'}</p>
        ${codeBlock}
    </div>
</body>
</html>`;
}

function renderVerificationSuccess(data: {
  certificate: {
    name: string;
    courseTitle: string;
    issuedAt: Date;
    code: string;
  };
  user: any;
  course: any;
}): string {
  const formattedDate = formatDate(data.certificate.issuedAt);
  const userName = data.certificate.name || data.user?.name || 'Unknown';
  const courseTitle =
    data.certificate.courseTitle || data.course?.title || 'Unknown Course';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Verification - ${userName} - AiCourse Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4">
    <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-4">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Verified Certificate
            </div>
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
            <p class="text-gray-600 text-lg">This certificate has been verified and is authentic</p>
        </div>
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
            <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-white">
                <h2 class="text-2xl font-bold">Certificate of Completion</h2>
                <p class="text-purple-100 text-sm">Verified by AiCourse Generator</p>
            </div>
            <div class="p-8 md:p-12">
                <div class="text-center mb-8 pb-8 border-b border-gray-200">
                    <p class="text-gray-600 mb-4">This is to certify that</p>
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">${userName}</h3>
                    <p class="text-gray-600 mb-4">has successfully completed</p>
                    <h4 class="text-2xl md:text-3xl font-bold text-purple-600 mb-4">${courseTitle}</h4>
                </div>
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Issued On</p>
                            <p class="text-lg font-semibold text-gray-900">${formattedDate}</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Certificate Code</p>
                            <p class="text-lg font-mono font-semibold text-gray-900">${data.certificate.code}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// GET /api/certificates/verify/:code - Verify certificate by code
export const GET = publicHandler(
  async (req: NextRequest, { params }: { params: { code: string } }) => {
    const { code } = params;

    if (!code) {
      if (shouldReturnHtml(req)) {
        return new NextResponse(
          generateVerificationHTML({
            valid: false,
            certificate: {} as any,
            user: null,
            course: null,
            error: 'Certificate code is required',
            code: '',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      }
      return NextResponse.json(
        { error: 'Certificate code is required' },
        { status: 400 }
      );
    }

    try {
      // Find certificate by code
      const certificate = await Certificate.findOne({ code })
        .populate('userId', 'name email')
        .populate('courseId', 'title description');

      if (!certificate) {
        if (shouldReturnHtml(req)) {
          return new NextResponse(
            generateVerificationHTML({
              valid: false,
              certificate: {} as any,
              user: null,
              course: null,
              error: 'Certificate not found or invalid code',
              code,
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'text/html' },
            }
          );
        }
        return NextResponse.json(
          { error: 'Certificate not found or invalid code' },
          { status: 404 }
        );
      }

      const responseData = {
        valid: true,
        certificate: {
          name: certificate.nameSnapshot,
          courseTitle: certificate.courseTitleSnapshot,
          issuedAt: certificate.issuedAt,
          code: certificate.code,
        },
        user: certificate.userId,
        course: certificate.courseId,
      };

      // Check if request is from a browser (wants HTML)
      if (shouldReturnHtml(req)) {
        return new NextResponse(generateVerificationHTML(responseData), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Return JSON for API requests
      return NextResponse.json(responseData);
    } catch (error: any) {
      if (shouldReturnHtml(req)) {
        return new NextResponse(
          generateVerificationHTML({
            valid: false,
            certificate: {} as any,
            user: null,
            course: null,
            error: 'Failed to verify certificate',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify certificate' },
        { status: 500 }
      );
    }
  }
);
