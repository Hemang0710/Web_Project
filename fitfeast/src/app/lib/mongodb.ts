import mongoose from 'mongoose';

const MONGODB_URI =
  'mongodb+srv://Sanket:Sanket%40800@cluster0.dshnuwx.mongodb.net/fitfeast';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use globalThis instead of global for better compatibility
declare global {
  // Avoid re-declaring if already exists
  // eslint-disable-next-line no-var
  var _mongoose: MongooseConnection | undefined;
}

const globalMongoose = globalThis._mongoose ?? {
  conn: null,
  promise: null,
};

if (!globalThis._mongoose) {
  globalThis._mongoose = globalMongoose;
}

async function connectDB(): Promise<typeof mongoose> {
  if (globalMongoose.conn) {
    console.log('✅ Using cached MongoDB connection');
    return globalMongoose.conn;
  }

  if (!globalMongoose.promise) {
    console.log('🔌 Connecting to MongoDB...');
    const options = {
      bufferCommands: false,
    };

    globalMongoose.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongoose) => {
        console.log('✅ MongoDB connected:', mongoose.connection.name);
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        throw err;
      });
  }

  globalMongoose.conn = await globalMongoose.promise;
  return globalMongoose.conn;
}

export default connectDB;
