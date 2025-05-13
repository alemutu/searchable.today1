import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://tawhspcsiufcfajbefyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd2hzcGNzaXVmY2ZhamJlZnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjMwODYsImV4cCI6MjA2MjczOTA4Nn0.n8xjRdGKdxJ908erWWkL400wO-QoQT4Q59hMiwGDWdQ';

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