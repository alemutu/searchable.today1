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
        }
      }
    } catch (error: any) {
      console.error('Error initializing auth:', error.message);
      set({ error: error.message });
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
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      set({ error: `Error logging in: ${error.message}` });
      throw error;
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
      }
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      set({ error: error.message });
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

      // Get user metadata from auth.users instead of profiles table
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      if (currentUser?.user_metadata) {
        const { role } = currentUser.user_metadata;
        
        set({
          isAdmin: role === 'super_admin',
          isDoctor: role === 'doctor',
          isNurse: role === 'nurse',
          isReceptionist: role === 'receptionist'
        });
        
        await get().fetchCurrentHospital();
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
    }
  },
  
  fetchCurrentHospital: async () => {
    try {
      const { user } = get();
      if (!user) return;
      
      // Get hospital_id from user metadata instead of profiles table
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (currentUser?.user_metadata?.hospital_id) {
        const { data: hospital, error: hospitalError } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', currentUser.user_metadata.hospital_id)
          .single();
        
        if (hospitalError) throw hospitalError;
        
        if (hospital) {
          set({ hospital });
          // Save hospital to local storage for offline use
          localStorage.setItem(`hospitals_${hospital.id}`, JSON.stringify(hospital));
        }
      }
    } catch (error: any) {
      console.error('Error fetching hospital:', error.message);
    }
  }
}));

// Notification store
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  notifiedEmergencies: new Set<string>(),
  
  addNotification: (notification) => {
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