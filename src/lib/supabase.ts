import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with secure configuration and timeout settings
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'hms-auth-token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'hms-web-client'
      },
      // Add request timeout to prevent hanging on recursive queries
      fetch: (url, options) => {
        const timeoutController = new AbortController();
        const { signal } = timeoutController;
        
        // Set a 10-second timeout
        const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
        
        return fetch(url, {
          ...options,
          signal,
        }).finally(() => clearTimeout(timeoutId));
      }
    },
    // Add database schema
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Get a fresh client instance
export const getClient = () => supabase;

// Session timeout handling
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600', 10) * 1000;
let sessionTimeoutId: number | null = null;

// Reset session timeout
export const resetSessionTimeout = () => {
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
  }
  
  sessionTimeoutId = window.setTimeout(async () => {
    console.log('Session timeout reached, logging out');
    await supabase.auth.signOut();
    window.location.href = '/login?timeout=true';
  }, SESSION_TIMEOUT);
};

// Initialize session timeout
export const initSessionTimeout = () => {
  ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetSessionTimeout, { passive: true });
  });
  
  resetSessionTimeout();
};

// Clear session timeout
export const clearSessionTimeout = () => {
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  
  ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.removeEventListener(event, resetSessionTimeout);
  });
};