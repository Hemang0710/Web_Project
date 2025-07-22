// Feature 8: Environment Config for APIs
export const config = {
  // Edamam API
  EDAMAM_APP_ID: process.env.EDAMAM_APP_ID || '',
  EDAMAM_APP_KEY: process.env.EDAMAM_APP_KEY || '',
  
  // Mistral AI API
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  
  // Walmart API (for future use)
  WALMART_API_KEY: process.env.WALMART_API_KEY || '',
  
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || '',
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // Other service keys
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Feature flags
  ENABLE_AI_FEATURES: process.env.ENABLE_AI_FEATURES === 'true',
  ENABLE_PRICE_ESTIMATION: process.env.ENABLE_PRICE_ESTIMATION === 'true',
  
  // API endpoints
  EDAMAM_BASE_URL: 'https://api.edamam.com/api/recipes/v2',
  WALMART_BASE_URL: 'https://api.walmart.com/v3',
  MISTRAL_BASE_URL: 'https://api.mistral.ai/v1',
  
  // Default values
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCATION: 'United States',
  DEFAULT_WEEKLY_BUDGET: 100,
  DEFAULT_DIET_TYPE: 'balanced',
  
  // Validation limits
  MIN_BUDGET: 10,
  MAX_BUDGET: 10000,
  MIN_HEIGHT: 100, // cm
  MAX_HEIGHT: 250, // cm
  MIN_WEIGHT: 30, // kg
  MAX_WEIGHT: 300, // kg
};

// Validate required environment variables
export function validateConfig() {
  const required = [
    'MISTRAL_API_KEY',
    'JWT_SECRET',
    'MONGODB_URI',
    'NEXTAUTH_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
}

// Export individual config values for convenience
export const {
  EDAMAM_APP_ID,
  EDAMAM_APP_KEY,
  MISTRAL_API_KEY,
  WALMART_API_KEY,
  JWT_SECRET,
  MONGODB_URI,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  ENABLE_AI_FEATURES,
  ENABLE_PRICE_ESTIMATION,
  EDAMAM_BASE_URL,
  WALMART_BASE_URL,
  MISTRAL_BASE_URL,
  DEFAULT_CURRENCY,
  DEFAULT_LOCATION,
  DEFAULT_WEEKLY_BUDGET,
  DEFAULT_DIET_TYPE,
  MIN_BUDGET,
  MAX_BUDGET,
  MIN_HEIGHT,
  MAX_HEIGHT,
  MIN_WEIGHT,
  MAX_WEIGHT
} = config; 