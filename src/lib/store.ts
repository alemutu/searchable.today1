import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { initializeStorage, syncAllData } from './storage';

interface AuthState {
  user: User | null;
  hospital: Hospital | null;
  isLoading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isReceptionist: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, metadata: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  fetchCurrentHospital: () => Promise<void>;
}

interface Hospital {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email?: string;
  logo_url?: string;
  patient_id_format?: string;
  patient_id_prefix?: string;
  patient_id_digits?: number;
  patient_id_auto_increment?: boolean;
  patient_id_last_number?: number;
  domain_enabled?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  notifiedEmergencies: Set<string>; // Track emergency IDs that have been notified
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  hasNotifiedAbout: (emergencyKey: string) => boolean;
  markAsNotified: (emergencyKey: string) => void;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
  duration?: number; // in milliseconds, default will be 3000
}

// Mock data for development
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
  user_metadata: {
    first_name: 'Dev',
    last_name: 'User',
    role: 'super_admin'
  }
} as User;

const mockHospital = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Development Hospital',
  subdomain: 'dev',
  address: '123 Dev Street',
  phone: '555-0123',
  patient_id_format: 'prefix_number',
  patient_id_prefix: 'PT',
  patient_id_digits: 6,
  patient_id_auto_increment: true,
  patient_id_last_number: 0
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hospital: null,
  isLoading: false,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  isReceptionist: false,
  error: null,
  
  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Initialize storage system
      initializeStorage();
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          set({ user });
          await get().fetchUserProfile();
          await syncAllData(); // Sync any pending changes
        } else {
          // Use mock data in development
          if (import.meta.env.DEV) {
            set({ 
              user: mockUser,
              hospital: mockHospital,
              isAdmin: true,
              isDoctor: true,
              isNurse: true,
              isReceptionist: true
            });
          }
        }
      } else {
        // Use mock data in development
        if (import.meta.env.DEV) {
          set({ 
            user: mockUser,
            hospital: mockHospital,
            isAdmin: true,
            isDoctor: true,
            isNurse: true,
            isReceptionist: true
          });
        }
      }
    } catch (error: any) {
      console.error('Error initializing auth:', error.message);
      set({ error: error.message });
      
      // Use mock data in development
      if (import.meta.env.DEV) {
        set({ 
          user: mockUser,
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        set({ user: data.user });
        await get().fetchUserProfile();
        await syncAllData(); // Sync any pending changes
      } else if (import.meta.env.DEV) {
        // Use mock data in development
        set({ 
          user: mockUser,
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true
        });
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      set({ error: `Error logging in: ${error.message}` });
      
      // Use mock data in development
      if (import.meta.env.DEV) {
        set({ 
          user: mockUser,
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },
  
  signup: async (email, password, metadata) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        set({ user: data.user });
      } else if (import.meta.env.DEV) {
        // Use mock data in development
        set({ 
          user: mockUser,
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true
        });
      }
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      set({ error: error.message });
      
      // Use mock data in development
      if (import.meta.env.DEV) {
        set({ 
          user: mockUser,
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null,
        hospital: null,
        isAdmin: false,
        isDoctor: false,
        isNurse: false,
        isReceptionist: false
      });
      
      // Use mock data in development
      if (import.meta.env.DEV) {
        set({ 
          user: mockUser,
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true
        });
      }
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchUserProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        set({
          isAdmin: data.role === 'admin' || data.role === 'super_admin',
          isDoctor: data.role === 'doctor',
          isNurse: data.role === 'nurse',
          isReceptionist: data.role === 'receptionist'
        });
        
        await get().fetchCurrentHospital();
      } else if (import.meta.env.DEV) {
        // Fallback to mock data in development
        set({
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true,
          hospital: mockHospital
        });
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
      
      // Fallback to mock data in development
      if (import.meta.env.DEV) {
        set({
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true,
          hospital: mockHospital
        });
      }
    }
  },
  
  fetchCurrentHospital: async () => {
    try {
      const { user } = get();
      if (!user) return;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      if (profile && profile.hospital_id) {
        const { data: hospital, error: hospitalError } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', profile.hospital_id)
          .single();
        
        if (hospitalError) throw hospitalError;
        
        if (hospital) {
          set({ hospital });
          // Save hospital to local storage for offline use
          localStorage.setItem(`hospitals_${hospital.id}`, JSON.stringify(hospital));
        } else if (import.meta.env.DEV) {
          set({ hospital: mockHospital });
        }
      } else if (import.meta.env.DEV) {
        set({ hospital: mockHospital });
      }
    } catch (error: any) {
      console.error('Error fetching hospital:', error.message);
      
      // Fallback to mock data in development
      if (import.meta.env.DEV) {
        set({ hospital: mockHospital });
      }
    }
  }
}));

// Notification store
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  notifiedEmergencies: new Set<string>(),
  
  addNotification: (notification) => {
    // For emergency notifications, check if we've already notified about this emergency
    if (notification.type === 'error' || notification.type === 'warning') {
      // Create a unique key from the message to identify duplicate notifications
      const messageKey = notification.message.trim().toLowerCase();
      
      // Check if we've already shown this emergency notification
      if (get().notifications.some(n => n.message.trim().toLowerCase() === messageKey)) {
        // Skip adding duplicate emergency notification
        return;
      }
    }
    
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          timestamp: Date.now(),
          ...notification
        }
      ]
    }));
    
    // Auto-remove notification after duration
    const duration = notification.duration || 3000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, duration);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id)
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  hasNotifiedAbout: (emergencyKey) => {
    return get().notifiedEmergencies.has(emergencyKey);
  },
  
  markAsNotified: (emergencyKey) => {
    set((state) => ({
      notifiedEmergencies: new Set([...state.notifiedEmergencies, emergencyKey])
    }));
  }
}));