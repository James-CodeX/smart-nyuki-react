import { createClient } from '@supabase/supabase-js';
import { ENV, validateEnv } from './env';

// Validate environment variables before creating the client
validateEnv();

// Create the Supabase client
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper function to check if a user is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}; 