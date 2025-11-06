import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interface
export interface IQuizResponse extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  moduleOrder: number;
  lessonOrder: number;
  questionIndex: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  score: number; // score for this question (1 if correct, 0 if incorrect)
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const QuizResponseSchema = new Schema<IQuizResponse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    moduleOrder: {
      type: Number,
      required: true,
    },
    lessonOrder: {
      type: Number,
      required: true,
    },
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
QuizResponseSchema.index({ userId: 1, courseId: 1, lessonId: 1, questionIndex: 1 }, { unique: true });

// Prevent model overwrite in Next.js serverless environment
export const QuizResponse = mongoose.models.QuizResponse || mongoose.model<IQuizResponse>('QuizResponse', QuizResponseSchema);

