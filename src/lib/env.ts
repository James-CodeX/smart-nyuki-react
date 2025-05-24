/**
 * Environment variables validation utility
 * This ensures that all required environment variables are present and properly formatted
 */

// Required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

// Optional environment variables with default values
const optionalEnvVars: Record<string, string> = {
  'VITE_APP_NAME': 'Smart Nyuki',
};

// Validate required environment variables
export function validateEnv(): void {
  const missingVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file or environment configuration.`
    );
  }
}

// Get environment variable with type safety
export function getEnv(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue;
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value;
}

// Get all environment variables with defaults applied
export function getAllEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  
  // Add all required variables
  for (const key of requiredEnvVars) {
    env[key] = getEnv(key);
  }
  
  // Add all optional variables with defaults
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    env[key] = getEnv(key, defaultValue);
  }
  
  return env;
}

// Export environment variables for easy access
export const ENV = {
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY'),
  APP_NAME: getEnv('VITE_APP_NAME', optionalEnvVars['VITE_APP_NAME']),
}; 