import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('❌ Please define the MONGODB_URI environment variable in .env');
}

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Avoid re-declaring in hot reload environments
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
      .connect(uri!, options)
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
