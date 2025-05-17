// This file is kept as a placeholder for future database integration
// All authentication and session management has been removed

// Create a dummy client for now
export const supabase = {
  from: (table: string) => ({
    select: (query?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, { ascending }: { ascending: boolean }) => 
          Promise.resolve({ data: [], error: null }),
        limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        in: (column: string, values: any[]) => Promise.resolve({ data: [], error: null }),
        not: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
        or: (query: string) => Promise.resolve({ data: [], error: null }),
      }),
      order: (column: string, { ascending }: { ascending: boolean }) => 
        Promise.resolve({ data: [], error: null }),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
    upsert: (data: any) => Promise.resolve({ data: null, error: null }),
  }),
  rpc: (func: string, params?: any) => Promise.resolve({ data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null }),
    signIn: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
  }
};

// Placeholder for future implementation
export const getClient = () => supabase;

// No-op functions for session management
export const resetSessionTimeout = () => {};
export const initSessionTimeout = () => {};
export const clearSessionTimeout = () => {};