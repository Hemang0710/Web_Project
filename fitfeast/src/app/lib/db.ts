import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://Sanket:Sanket%40800@cluster0.dshnuwx.mongodb.net/fitfeast';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI connection string');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting?: boolean;
}

type MongooseError = Error & {
  code?: string;
  name: string;
};

// Use globalThis for assignment
if (!globalThis.mongoose) {
  globalThis.mongoose = { conn: null, promise: null };
}

const cached: MongooseCache = globalThis.mongoose;

export async function connectToDatabase() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts: mongoose.ConnectOptions = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        connectTimeoutMS: 10000,
        retryWrites: true,
        w: 'majority'
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      }).catch((error) => {
        console.error('MongoDB connection error:', error);
        throw new Error('Failed to connect to MongoDB: ' + error.message);
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('Database connection error:', error);
    throw new Error('Failed to establish database connection: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('Disconnected from MongoDB');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});