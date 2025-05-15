import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cyxlbkzxaoonahfcrfua.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eGxia3p4YW9vbmFoZmNyZnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTc4NDMsImV4cCI6MjA2Mjg3Mzg0M30.t0TahBAb4ORolqqK_KBFfRg7SXKHlJ8c4H3S-TPw4_w';

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

export const getClient = () => supabase;