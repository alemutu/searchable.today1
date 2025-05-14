import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mqxdrsdvaqntphrlyfgm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xeGRyc2R2YXFudHBocmx5ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjM1OTcsImV4cCI6MjA2Mjc5OTU5N30.IMOxQ-_c4odB0ZTchtakwgI9hx2pxIjjpjY85V_q-FI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
);

// Add getClient function to return the Supabase client instance
export const getClient = () => supabase;