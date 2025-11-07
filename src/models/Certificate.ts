
import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  code: string;
  nameSnapshot: string;
  courseTitleSnapshot: string;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  nameSnapshot: {
    type: String,
    required: true
  },
  courseTitleSnapshot: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient lookups
CertificateSchema.index({ userId: 1, courseId: 1 });
CertificateSchema.index({ code: 1 }, { unique: true });

// Prevent model overwrite in Next.js serverless environment
export const Certificate = mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
