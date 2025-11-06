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

// GET /api/courses/:id/export - Export course as PDF
export const GET = withAuth(async (
  req: NextAuthRequest,
  context?: { params: { id: string } }
) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context?.params || { id: '' };
  const userId = req.user.sub;

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 });
  }

  // Find course with full data
  const course = await Course.findById(id).lean<{
    userId: any;
    title: string;
    language?: string;
    summary?: string;
    modules?: IModule[];
  }>();

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Ownership check - handle both ObjectId and string formats
  const courseUserId = course.userId ? (typeof course.userId === 'string' ? course.userId : String(course.userId)) : '';
  if (courseUserId !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    // Dynamically import PDFKit to avoid webpack bundling issues
    // Use require() at runtime to avoid webpack bundling
    const PDFKit = require('pdfkit');
    const PDFDocument = PDFKit.default || PDFKit;
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Collect PDF chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Course title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(course.title, { align: 'center' });
    doc.moveDown(1);

    // Course metadata
    doc.fontSize(14)
       .font('Helvetica')
       .text(`Language: ${course.language || 'English'}`, { align: 'center' });
    
    if (course.summary) {
      doc.moveDown(0.5);
      doc.text(`Summary: ${course.summary}`, { align: 'center' });
    }

    doc.moveDown(2);

    // Course content
    const validModules = Array.isArray(course.modules)
      ? (course.modules.filter((module): module is IModule => !!module) as IModule[])
      : [];

    if (validModules.length > 0) {
      const sortedModules = [...validModules].sort((a, b) => a.order - b.order);
      for (let moduleIndex = 0; moduleIndex < sortedModules.length; moduleIndex++) {
        const module = sortedModules[moduleIndex];
        
        const lessons = Array.isArray(module.lessons)
          ? (module.lessons.filter((lesson): lesson is ILesson => !!lesson) as ILesson[])
          : [];

        if (lessons.length > 0) {
          const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
          const generatedLessons = sortedLessons.filter((lesson) => !!lesson.content);
          
          if (generatedLessons.length > 0) {
            // Module title
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .text(`Module ${module.order}: ${module.title}`, { underline: true });
            doc.moveDown(1);

            // Export generated lessons
            for (let lessonIndex = 0; lessonIndex < generatedLessons.length; lessonIndex++) {
              const lesson = generatedLessons[lessonIndex] as ILesson;
              
              // Lesson title
              doc.fontSize(16)
                 .font('Helvetica-Bold')
                 .text(`Lesson ${lesson.order}: ${lesson.title}`);
              doc.moveDown(0.5);

              if (lesson.summary) {
                doc.fontSize(12)
                   .font('Helvetica-Oblique')
                   .text(`Summary: ${lesson.summary}`);
                doc.moveDown(0.5);
              }

              if (lesson.content) {
                // Theory
                if (lesson.content.theoryMd) {
                  doc.fontSize(14)
                     .font('Helvetica-Bold')
                     .text('Theory:');
                  doc.moveDown(0.3);
                  
                  const theoryText = stripMarkdown(String(lesson.content.theoryMd || ''));
                  doc.fontSize(12)
                     .font('Helvetica')
                     .text(theoryText || '', { ellipsis: true });
                  doc.moveDown(1);
                }

                // Example
                if (lesson.content.exampleMd) {
                  doc.fontSize(14)
                     .font('Helvetica-Bold')
                     .text('Example:');
                  doc.moveDown(0.3);
                  
                  const exampleText = stripMarkdown(String(lesson.content.exampleMd || ''));
                  doc.fontSize(12)
                     .font('Helvetica')
                     .text(exampleText || '', { ellipsis: true });
                  doc.moveDown(1);
                }

                // Exercise
                if (lesson.content.exerciseMd) {
                  doc.fontSize(14)
                     .font('Helvetica-Bold')
                     .text('Exercise:');
                  doc.moveDown(0.3);
                  
                  const exerciseText = stripMarkdown(String(lesson.content.exerciseMd || ''));
                  doc.fontSize(12)
                     .font('Helvetica')
                     .text(exerciseText || '', { ellipsis: true });
                  doc.moveDown(1);
                }

                // Key Takeaways
                if (Array.isArray(lesson.content.keyTakeaways) && lesson.content.keyTakeaways.length > 0) {
                  doc.fontSize(14)
                     .font('Helvetica-Bold')
                     .text('Key Takeaways:');
                  doc.moveDown(0.3);
                  
                  lesson.content.keyTakeaways.forEach((takeaway) => {
                    const processedTakeaway = preprocessMathForPDF(takeaway);
                    doc.fontSize(12)
                       .font('Helvetica')
                       .text(`• ${processedTakeaway}`);
                  });
                  doc.moveDown(1);
                }

                // Quiz
                if (
                  lesson.content.quiz &&
                  Array.isArray(lesson.content.quiz.questions) &&
                  lesson.content.quiz.questions.length > 0
                ) {
                  doc.fontSize(14)
                     .font('Helvetica-Bold')
                     .text('Quiz:');
                  doc.moveDown(0.3);
                  
                  lesson.content.quiz.questions.forEach((question, qIndex) => {
                    const processedStem = preprocessMathForPDF(String(question.stem || ''));
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text(`Q${qIndex + 1}: ${processedStem}`, { ellipsis: true });
                    doc.moveDown(0.2);
                    
                    if (Array.isArray(question.options)) {
                      question.options.forEach((option, oIndex) => {
                        const optionLetter = String.fromCharCode(65 + oIndex);
                        const processedOption = preprocessMathForPDF(String(option || ''));
                        doc.fontSize(11)
                           .font('Helvetica')
                           .text(`  ${optionLetter}. ${processedOption}`, { ellipsis: true });
                      });
                    }
                    
                    doc.moveDown(0.3);
                    const processedRationale = preprocessMathForPDF(String(question.rationale || ''));
                    doc.fontSize(11)
                       .font('Helvetica-Oblique')
                       .text(`Rationale: ${processedRationale}`, { ellipsis: true });
                    doc.moveDown(0.5);
                  });
                }

                // Videos and Media (after Quiz)
                if (Array.isArray(lesson.content.media) && lesson.content.media.length > 0) {
                  const videos = lesson.content.media.filter((item: any) => item.type === 'video' && item.url);
                  const images = lesson.content.media.filter((item: any) => item.type === 'image' && item.url);
                  
                  if (videos.length > 0) {
                    doc.fontSize(14)
                       .font('Helvetica-Bold')
                       .text('Videos:');
                    doc.moveDown(0.3);
                    
                    videos.forEach((video: any, vIndex: number) => {
                      const videoTitle = video.title || video.alt || `Video ${vIndex + 1}`;
                      const videoUrl = String(video.url || '');

                      if (videoUrl) {
                        // Convert embed URL to watch URL for PDF links
                        // Embed URLs don't work when opened directly in browser
                        const videoId = extractYouTubeVideoId(videoUrl);
                        const watchUrl = videoId 
                          ? `https://www.youtube.com/watch?v=${videoId}`
                          : videoUrl; // Fallback to original URL if extraction fails

                        doc.fontSize(12)
                           .font('Helvetica-Bold')
                           .fillColor('blue')
                           .text(`${vIndex + 1}. ${videoTitle}`, {
                             link: watchUrl,
                             underline: true,
                           });
                        doc.fontSize(11)
                           .font('Helvetica')
                           .fillColor('black')
                           .text(`   ${watchUrl}`, { ellipsis: true });
                        doc.moveDown(0.5);
                      }
                    });
                    
                    doc.fillColor('black'); // Reset color
                    doc.moveDown(0.5);
                  }
                  
                  if (images.length > 0) {
                    doc.fontSize(14)
                       .font('Helvetica-Bold')
                       .text('Images:');
                    doc.moveDown(0.3);
                    
                    images.forEach((image: any, iIndex: number) => {
                      const imageTitle = image.title || image.alt || `Image ${iIndex + 1}`;
                      const imageUrl = String(image.url || '');
                      
                      if (imageUrl) {
                        doc.fontSize(12)
                           .font('Helvetica-Bold')
                           .fillColor('blue')
                           .text(`${iIndex + 1}. ${imageTitle}`, {
                             link: imageUrl,
                             underline: true,
                           });
                        doc.fontSize(11)
                           .font('Helvetica')
                           .fillColor('black')
                           .text(`   ${imageUrl}`, { ellipsis: true });
                        doc.moveDown(0.5);
                      }
                    });
                    
                    doc.fillColor('black'); // Reset color
                    doc.moveDown(0.5);
                  }
                }
              }

              // Add page break between lessons if not the last
              if (lessonIndex < generatedLessons.length - 1) {
                doc.addPage();
              }
            }
            
            // Add page break between modules if not the last
            if (moduleIndex < validModules.length - 1) {
              doc.addPage();
            }
          }
        }
      }
    } else {
      doc.fontSize(14)
         .font('Helvetica')
         .text('This course has no content yet.', { align: 'center' });
    }

    // Footer
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated on ${new Date().toLocaleDateString()}`, 50, doc.page.height - 100, { align: 'center' });

    // Wait for PDF to be generated - set up handlers BEFORE calling end()
    return new Promise<NextResponse>((resolve, reject) => {
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('PDF generation timeout'));
      }, 30000); // 30 seconds timeout

      doc.on('end', () => {
        clearTimeout(timeout);
        try {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
            },
          }));
        } catch (error: any) {
          reject(error);
        }
      });

      doc.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Finalize PDF - call end() AFTER setting up handlers
      doc.end();
    });
  } catch (error: any) {
    console.error('Export error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to export course' },
      { status: 500 }
    );
  }
});
