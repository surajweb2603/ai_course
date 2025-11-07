
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  plan: 'free' | 'monthly' | 'yearly';
  provider: 'local' | 'google';
  googleId?: string;
  passwordHash?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly'],
    default: 'free',
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  passwordHash: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create unique index on email
userSchema.index({ email: 1 }, { unique: true });

// Prevent model overwrite in Next.js serverless environment
const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;

