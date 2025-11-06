import mongoose from 'mongoose';

// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-course-generator';

// Validate that we have a proper MongoDB URI (not localhost) in production
if (process.env.NODE_ENV === 'production' && MONGO_URI.includes('localhost')) {
  console.warn('⚠️  Warning: Using localhost MongoDB URI in production. This will not work on Vercel.');
}

// Cache the database connection
let cachedConnection: typeof mongoose | null = null;

export const connectDB = async () => {
  // Return cached connection if available (for serverless)
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Connect with connection pooling for serverless
    const connection = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// For serverless environments, we don't want to exit the process on connection failure
// Instead, we'll let the function handle it
export const connectDBForServerless = async () => {
  // Check connection state: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const readyState = mongoose.connection.readyState as number;
  
  if (cachedConnection && readyState === 1) {
    return cachedConnection;
  }

  // Check if already connecting
  if (readyState === 2) {
    // Wait for connection to complete
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', resolve);
    });
    // Re-check connection state after waiting
    const newReadyState = mongoose.connection.readyState as number;
    if (newReadyState === 1) {
      cachedConnection = mongoose;
      return cachedConnection;
    }
  }

  try {
    const connection = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000, // Reduced from 5s to 3s for faster failure
      socketTimeoutMS: 45000,
      connectTimeoutMS: 3000, // Add connection timeout
    });

    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't throw in serverless - let the function handle gracefully
    return null;
  }
};

