import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interface
export interface IProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessonKeys: string[]; // format: `${moduleOrder}:${lessonOrder}`
  percent: number; // 0..100
  updatedAt: Date;
}

// Mongoose schema
const ProgressSchema = new Schema<IProgress>(
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
    completedLessonKeys: {
      type: [String],
      default: [],
    },
    percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Prevent model overwrite in Next.js serverless environment
export const Progress = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

