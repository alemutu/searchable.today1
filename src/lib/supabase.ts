import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with secure configuration
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Changed to false to prevent URL parsing issues
      storage: localStorage, // Explicitly set storage
      storageKey: 'hms-auth-token', // Custom storage key
      flowType: 'pkce' // Use PKCE flow for added security
    },
    global: {
      headers: {
        'X-Client-Info': 'hms-web-client'
      }
    },
    // Add retry configuration
    retryAttempts: 3,
    retryInterval: 1000
  }
);

// Get a fresh client instance
export const getClient = () => supabase;

// Session timeout handling
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600', 10) * 1000;
let sessionTimeoutId: number | null = null;

// Check network connectivity
const isOnline = () => navigator.onLine;

// Reset session timeout
export const resetSessionTimeout = () => {
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
  }
  
  sessionTimeoutId = window.setTimeout(async () => {
    console.log('Session timeout reached, logging out');
    if (isOnline()) {
      await supabase.auth.signOut();
      window.location.href = '/login?timeout=true';
    } else {
      console.log('Offline: Session timeout handling deferred');
    }
  }, SESSION_TIMEOUT);
};

// Initialize session timeout
export const initSessionTimeout = () => {
  // Add event listeners to reset timeout on user activity
  ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetSessionTimeout, { passive: true });
  });
  
  // Initial timeout setup
  resetSessionTimeout();
};

// Clear session timeout
export const clearSessionTimeout = () => {
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  
  // Remove event listeners
  ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.removeEventListener(event, resetSessionTimeout);
  });
};