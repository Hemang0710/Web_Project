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

export async function disconnectFromDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      globalMongoose.conn = null;
      globalMongoose.promise = null;
      console.log('✅ Disconnected from MongoDB');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Using existing MongoDB connection');
      return mongoose;
    }

    if (!globalMongoose.promise) {
      console.log('🔌 Connecting to MongoDB...');
      const options: mongoose.ConnectOptions = {
        dbName: 'fitfeast',
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased from 5000
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
        w: 'majority'
      };
      
      console.log('Connecting to MongoDB with options:', {
        dbName: 'fitfeast',
        serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
        socketTimeoutMS: options.socketTimeoutMS,
        connectTimeoutMS: options.connectTimeoutMS
      });

      // Close any existing connections first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      globalMongoose.promise = mongoose
        .connect(uri!, options)
        .then((mongoose) => {
          console.log('✅ MongoDB connected:', mongoose.connection.name);
          globalMongoose.conn = mongoose;
          return mongoose;
        })
        .catch((error) => {
          console.error('❌ MongoDB connection error:', error);
          globalMongoose.promise = null;
          throw error;
        });
    }

    return await globalMongoose.promise;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export default connectDB;
