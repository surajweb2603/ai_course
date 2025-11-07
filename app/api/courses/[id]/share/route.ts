import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import {
  Course,
  ICourse,
  IModule,
  ILesson,
  IMediaItem,
} from '@/src/models/Course';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/courses/:id/share - Get public course for sharing
export const GET = publicHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    type CourseLean = {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      title: string;
      language: string;
      summary?: string;
      tags?: string[];
      visibility: ICourse['visibility'];
      modules: IModule[];
    };

    // Find course
    const course = await Course.findById(id).lean<CourseLean>();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is shareable
    if (course.visibility === 'private') {
      return NextResponse.json(
        { error: 'This course is private and cannot be shared' },
        { status: 403 }
      );
    }

    // Return public course data
    const publicCourse = {
      _id: course._id,
      title: course.title,
      language: course.language,
      summary: course.summary,
      tags: course.tags,
      visibility: course.visibility,
      modules: course.modules.map((module: IModule) => ({
        _id: module._id,
        order: module.order,
        title: module.title,
        lessons: module.lessons.map((lesson: ILesson) => ({
          _id: lesson._id,
          order: lesson.order,
          title: lesson.title,
          summary: lesson.summary,
          content: lesson.content
            ? {
                theoryMd: lesson.content.theoryMd,
                exampleMd: lesson.content.exampleMd,
                exerciseMd: lesson.content.exerciseMd,
                keyTakeaways: lesson.content.keyTakeaways,
                media: lesson.content.media?.map((item: IMediaItem) => ({
                  type: item.type,
                  url: item.url ?? null,
                  alt: item.alt,
                  prompt: item.prompt ?? null,
                  title: item.title,
                })),
                quiz: lesson.content.quiz
                  ? {
                      questions: lesson.content.quiz.questions.map(
                        (q: any) => ({
                          stem: q.stem,
                          options: q.options,
                          answerIndex: q.answerIndex,
                          rationale: q.rationale,
                        })
                      ),
                    }
                  : null,
                estimatedMinutes: lesson.content.estimatedMinutes,
              }
            : null,
        })),
      })),
    };

    return NextResponse.json({ course: publicCourse });
  }
);
