import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interfaces
export interface IMediaItem {
  type: 'image' | 'video';
  url?: string | null;
  alt?: string;
  prompt?: string | null;
  title?: string;
}

export interface IQuizQuestion {
  stem: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

export interface IQuiz {
  questions: IQuizQuestion[];
}

export interface ILessonContent {
  theoryMd: string;
  exampleMd: string;
  exerciseMd: string;
  keyTakeaways: string[];
  media?: IMediaItem[];
  quiz: IQuiz;
  estimatedMinutes?: number;
}

export interface ILesson {
  _id: Types.ObjectId;
  order: number;
  title: string;
  summary?: string;
  content?: ILessonContent;
}

export interface IModule {
  _id: Types.ObjectId;
  order: number;
  title: string;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  userId: Types.ObjectId;
  title: string;
  language: string;
  summary?: string;
  tags?: string[];
  visibility: 'private' | 'unlisted' | 'public';
  modules: IModule[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schemas
const MediaItemSchema = new Schema<IMediaItem>({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, default: null },
  alt: { type: String },
  prompt: { type: String, default: null },
  title: { type: String },
}, { _id: false });

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  stem: { type: String, required: true },
  options: [{ type: String, required: true }],
  answerIndex: { type: Number, required: true },
  rationale: { type: String, required: true },
}, { _id: false });

const QuizSchema = new Schema<IQuiz>({
  questions: [QuizQuestionSchema],
}, { _id: false });

const LessonContentSchema = new Schema<ILessonContent>({
  theoryMd: { type: String, required: true },
  exampleMd: { type: String, required: true },
  exerciseMd: { type: String, required: true },
  keyTakeaways: [{ type: String, required: true }],
  media: [MediaItemSchema],
  quiz: { type: QuizSchema, required: true },
  estimatedMinutes: { type: Number },
}, { _id: false });

const LessonSchema = new Schema<ILesson>({
  _id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
  order: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  summary: { type: String },
  content: { type: LessonContentSchema },
});

const ModuleSchema = new Schema<IModule>({
  _id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
  order: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  lessons: [LessonSchema],
});

const CourseSchema = new Schema<ICourse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    language: {
      type: String,
      default: 'en',
    },
    summary: {
      type: String,
      trim: true,
    },
    tags: [{ type: String }],
    visibility: {
      type: String,
      enum: ['private', 'unlisted', 'public'],
      default: 'private',
    },
    modules: [ModuleSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
CourseSchema.index({ userId: 1, createdAt: -1 });
CourseSchema.index({ title: 'text' });

// Prevent model overwrite in Next.js serverless environment
export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
