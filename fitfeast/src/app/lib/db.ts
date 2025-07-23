import { connectDB } from './mongodb';

// Re-export the connectDB function
export { connectDB };

// For backward compatibility
export const connectToDatabase = connectDB;

// Export disconnect function from mongodb
export { disconnectFromDatabase } from './mongodb';