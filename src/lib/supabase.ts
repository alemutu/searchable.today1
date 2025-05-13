import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xlehmcwimslmkqooxoug.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZWhtY3dpbXNsbWtxb294b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0NzQ0NzcsImV4cCI6MjAyMzA1MDQ3N30.Ks0HwzNmyYlYLs-vJKZJWgGTkMrKiHnkWCnwGDpKcgY';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a mock client for development and offline use
const createMockClient = () => {
  const mockClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          order: () => ({
            order: () => ({
              range: async () => ({ data: [], error: null })
            }),
            range: async () => ({ data: [], error: null })
          }),
          limit: async () => ({ data: [], error: null })
        }),
        order: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null })
          }),
          limit: async () => ({ data: [], error: null })
        }),
        limit: async () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'mock-id' }, error: null }),
          maybeSingle: async () => ({ data: { id: 'mock-id' }, error: null })
        })
      }),
      update: () => ({
        eq: async () => ({ data: null, error: null }),
        match: async () => ({ data: null, error: null })
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: null }),
        match: async () => ({ data: null, error: null })
      }),
      upsert: async () => ({ data: null, error: null })
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: null, subscription: { unsubscribe: () => {} } }),
      signUp: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
      signIn: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
      admin: {
        deleteUser: async () => ({ error: null })
      }
    },
    rpc: (functionName: string, params?: any) => {
      // For search_patients function
      if (functionName === 'search_patients') {
        return {
          then: (callback: any) => {
            return callback({
              data: [
                {
                  id: 'mock-patient-id',
                  first_name: 'John',
                  last_name: 'Doe',
                  date_of_birth: '1990-01-01',
                  gender: 'Male',
                  contact_number: '555-1234',
                  email: 'john.doe@example.com',
                  address: '123 Main St',
                  emergency_contact: {
                    name: 'Jane Doe',
                    relationship: 'Spouse',
                    phone: '555-5678'
                  },
                  medical_info: {
                    allergies: [
                      { allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }
                    ],
                    chronicConditions: ['Hypertension'],
                    currentMedications: [
                      { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' }
                    ]
                  },
                  hospital_id: 'mock-hospital-id',
                  status: 'active',
                  current_flow_step: 'registration'
                }
              ],
              error: null
            });
          }
        };
      }
      
      // For other RPC functions
      return {
        then: (callback: any) => {
          return callback({ data: null, error: null });
        }
      };
    }
  };
  
  return mockClient as any;
};

// Export the mock client for offline use
export const mockSupabase = createMockClient();

// Return the appropriate client based on online status
export const getClient = () => {
  return navigator.onLine ? supabase : mockSupabase;
};