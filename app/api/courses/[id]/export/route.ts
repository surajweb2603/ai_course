import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { Course, ICourse, IModule, ILesson } from '@/src/models/Course';
import { extractYouTubeVideoId } from '@/app/utils/youtube';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to preprocess math content for PDF
function preprocessMathForPDF(content: string): string {
  // Simplified preprocessing - remove broken LaTeX patterns
  let processed = content
    .replace(/†ðxed\{[^}]*\}?/g, '')
    .replace(/ightarrow/g, '')
    .replace(/-Pxt\{([^}]*)\}/g, '$1')
    .replace(/ext\{([^}]*)\}/g, '$1')
    .trim();
  return processed;
}

// Helper function to strip markdown
function stripMarkdown(text: string): string {
  let processed = preprocessMathForPDF(text);
  return processed
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface CourseData {
  userId: any;
  title: string;
  language?: string;
  summary?: string;
  modules?: IModule[];
}

// GET /api/courses/:id/export - Export course as PDF
export const GET = withAuth(
  async (req: NextAuthRequest, context?: { params: { id: string } }) => {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context?.params || { id: '' };
    const userId = req.user.sub;

    const courseOrError = await loadCourseForExport(id, userId);
    if (courseOrError instanceof NextResponse) {
      return courseOrError;
    }

    try {
      const pdfBuffer = await createCoursePdf(courseOrError);
      return buildPdfResponse(pdfBuffer, courseOrError.title);
    } catch (error: any) {
      console.error('Export error:', error);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { error: error.message || 'Failed to export course' },
        { status: 500 }
      );
    }
  }
);

async function loadCourseForExport(
  courseId: string,
  userId: string
): Promise<CourseData | NextResponse> {
  if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
    return NextResponse.json(
      { error: 'Invalid course ID format' },
      { status: 400 }
    );
  }

  const course = await Course.findById(courseId).lean<CourseData>();
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const courseUserId = course.userId
    ? typeof course.userId === 'string'
      ? course.userId
      : String(course.userId)
    : '';

  if (courseUserId !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return course;
}

async function createCoursePdf(course: CourseData): Promise<Buffer> {
  const PDFKit = await import('pdfkit');
  const PDFDocument = PDFKit.default || PDFKit;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  renderCourseHeader(doc, course);
  renderModules(doc, course.modules || []);
  renderFooter(doc);

  return finalizePdf(doc, chunks);
}

function renderCourseHeader(doc: any, course: CourseData): void {
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text(course.title, { align: 'center' });
  doc.moveDown(1);
  doc
    .fontSize(14)
    .font('Helvetica')
    .text(`Language: ${course.language || 'English'}`, { align: 'center' });

  if (course.summary) {
    doc.moveDown(0.5);
    doc.text(`Summary: ${course.summary}`, { align: 'center' });
  }

  doc.moveDown(2);
}

function renderModules(doc: any, modules: IModule[]): void {
  const validModules = Array.isArray(modules)
    ? (modules.filter((module): module is IModule => !!module) as IModule[])
    : [];

  if (validModules.length === 0) {
    doc
      .fontSize(14)
      .font('Helvetica')
      .text('This course has no content yet.', { align: 'center' });
    return;
  }

  const sortedModules = [...validModules].sort((a, b) => a.order - b.order);

  sortedModules.forEach((module, moduleIndex) => {
    const lessons = Array.isArray(module.lessons)
      ? (module.lessons.filter(
          (lesson): lesson is ILesson => !!lesson
        ) as ILesson[])
      : [];

    renderModule(doc, module, lessons);

    if (moduleIndex < sortedModules.length - 1) {
      doc.addPage();
    }
  });
}

function renderModule(doc: any, module: IModule, lessons: ILesson[]): void {
  if (lessons.length === 0) {
    return;
  }

  const generatedLessons = [...lessons]
    .sort((a, b) => a.order - b.order)
    .filter((lesson) => !!lesson.content);

  if (generatedLessons.length === 0) {
    return;
  }

  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(`Module ${module.order}: ${module.title}`, { underline: true });
  doc.moveDown(1);

  generatedLessons.forEach((lesson, lessonIndex) => {
    renderLesson(doc, lesson);

    if (lessonIndex < generatedLessons.length - 1) {
      doc.addPage();
    }
  });
}

function renderLesson(doc: any, lesson: ILesson): void {
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(`Lesson ${lesson.order}: ${lesson.title}`);
  doc.moveDown(0.5);

  if (lesson.summary) {
    doc
      .fontSize(12)
      .font('Helvetica-Oblique')
      .text(`Summary: ${lesson.summary}`);
    doc.moveDown(0.5);
  }

  if (!lesson.content) {
    return;
  }

  renderLessonSections(doc, lesson.content);
}

function renderLessonSections(doc: any, content: any): void {
  if (content.theoryMd) {
    renderTextSection(doc, 'Theory:', content.theoryMd);
  }

  if (content.exampleMd) {
    renderTextSection(doc, 'Example:', content.exampleMd);
  }

  if (content.exerciseMd) {
    renderTextSection(doc, 'Exercise:', content.exerciseMd);
  }

  if (Array.isArray(content.keyTakeaways) && content.keyTakeaways.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Key Takeaways:');
    doc.moveDown(0.3);
    content.keyTakeaways.forEach((takeaway: string) => {
      const processedTakeaway = preprocessMathForPDF(takeaway);
      doc.fontSize(12).font('Helvetica').text(`• ${processedTakeaway}`);
    });
    doc.moveDown(1);
  }

  if (content.quiz?.questions?.length) {
    renderQuiz(doc, content.quiz.questions);
  }

  if (Array.isArray(content.media) && content.media.length > 0) {
    renderLessonMedia(doc, content.media);
  }
}

function renderTextSection(doc: any, heading: string, rawText: string): void {
  doc.fontSize(14).font('Helvetica-Bold').text(heading);
  doc.moveDown(0.3);

  const processed = stripMarkdown(String(rawText || ''));
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(processed || '', { ellipsis: true });
  doc.moveDown(1);
}

function renderQuiz(doc: any, questions: any[]): void {
  doc.fontSize(14).font('Helvetica-Bold').text('Quiz:');
  doc.moveDown(0.3);

  questions.forEach((question, qIndex) => {
    const processedStem = preprocessMathForPDF(String(question.stem || ''));
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Q${qIndex + 1}: ${processedStem}`, { ellipsis: true });
    doc.moveDown(0.2);

    if (Array.isArray(question.options)) {
      question.options.forEach((option: string, oIndex: number) => {
        const optionLetter = String.fromCharCode(65 + oIndex);
        const processedOption = preprocessMathForPDF(String(option || ''));
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`  ${optionLetter}. ${processedOption}`, { ellipsis: true });
      });
    }

    doc.moveDown(0.3);
    const processedRationale = preprocessMathForPDF(
      String(question.rationale || '')
    );
    doc
      .fontSize(11)
      .font('Helvetica-Oblique')
      .text(`Rationale: ${processedRationale}`, { ellipsis: true });
    doc.moveDown(0.5);
  });
}

function renderLessonMedia(doc: any, media: any[]): void {
  const videos = media.filter((item: any) => item.type === 'video' && item.url);
  const images = media.filter((item: any) => item.type === 'image' && item.url);

  if (videos.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Videos:');
    doc.moveDown(0.3);
    videos.forEach((video: any, vIndex: number) => {
      renderVideoLink(doc, video, vIndex);
    });
    doc.fillColor('black');
    doc.moveDown(0.5);
  }

  if (images.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Images:');
    doc.moveDown(0.3);
    images.forEach((image: any, iIndex: number) => {
      renderImageLink(doc, image, iIndex);
    });
    doc.fillColor('black');
    doc.moveDown(0.5);
  }
}

function renderVideoLink(doc: any, video: any, index: number): void {
  const videoTitle = video.title || video.alt || `Video ${index + 1}`;
  const videoUrl = String(video.url || '');

  if (!videoUrl) {
    return;
  }

  const videoId = extractYouTubeVideoId(videoUrl);
  const watchUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : videoUrl;

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('blue')
    .text(`${index + 1}. ${videoTitle}`, { link: watchUrl, underline: true });
  doc
    .fontSize(11)
    .font('Helvetica')
    .fillColor('black')
    .text(`   ${watchUrl}`, { ellipsis: true });
  doc.moveDown(0.5);
}

function renderImageLink(doc: any, image: any, index: number): void {
  const imageTitle = image.title || image.alt || `Image ${index + 1}`;
  const imageUrl = String(image.url || '');

  if (!imageUrl) {
    return;
  }

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('blue')
    .text(`${index + 1}. ${imageTitle}`, { link: imageUrl, underline: true });
  doc
    .fontSize(11)
    .font('Helvetica')
    .fillColor('black')
    .text(`   ${imageUrl}`, { ellipsis: true });
  doc.moveDown(0.5);
}

function renderFooter(doc: any): void {
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(
      `Generated on ${new Date().toLocaleDateString()}`,
      50,
      doc.page.height - 100,
      { align: 'center' }
    );
}

function finalizePdf(doc: any, chunks: Buffer[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('PDF generation timeout'));
    }, 30000);

    doc.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(Buffer.concat(chunks as unknown as readonly Uint8Array[]));
      } catch (error) {
        reject(error);
      }
    });

    doc.on('error', (error: any) => {
      clearTimeout(timeout);
      reject(error);
    });

    doc.end();
  });
}

function buildPdfResponse(buffer: Buffer, courseTitle: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
    },
  });
}
