import mongoose, { Document, Schema } from 'mongoose';

export interface IUserStats extends Document {
  userId: mongoose.Types.ObjectId;
  coursesCreated: number;
  learningTimeMinutes: number;
  completionRate: number;
  achievements: number;
  currentStreak: number;
  lastActivityDate: Date;
  updatedAt: Date;
}

const userStatsSchema = new Schema<IUserStats>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  coursesCreated: {
    type: Number,
    default: 0,
  },
  learningTimeMinutes: {
    type: Number,
    default: 0,
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  achievements: {
    type: Number,
    default: 0,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  lastActivityDate: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
userStatsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Prevent model overwrite in Next.js serverless environment
const UserStats = mongoose.models.UserStats || mongoose.model<IUserStats>('UserStats', userStatsSchema);

export default UserStats;

