import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { initializeStorage, syncAllData } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { clearSensitiveData } from './security';

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
  clearAuthState: () => void;
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
  notifiedEmergencies: Set<string>;
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
  duration?: number;
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
  
  clearAuthState: () => {
    set({
      user: null,
      hospital: null,
      isAdmin: false,
      isDoctor: false,
      isNurse: false,
      isReceptionist: false,
      error: null
    });
    clearSensitiveData();
  },
  
  initialize: async () => {
    try {
      set({ isLoading: true });
      
      initializeStorage();
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (session) {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            // If we can't get the user, clear the auth state and force re-login
            get().clearAuthState();
            throw userError;
          }
          
          if (user) {
            set({ user });
            await get().fetchUserProfile();
            await syncAllData();
          }
        } catch (error: any) {
          console.error('Error fetching user:', error.message);
          // Clear auth state and force re-login on any user fetch error
          await get().logout();
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error initializing auth:', error.message);
      get().clearAuthState();
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
        await syncAllData();
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      get().clearAuthState();
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
      get().clearAuthState();
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      
      // Clear auth state before signing out to prevent race conditions
      get().clearAuthState();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        // If we get a 403 or user not found error, clear auth state and force re-login
        if (userError.status === 403 || userError.message.includes('user_not_found')) {
          await get().logout();
        }
        throw userError;
      }

      if (currentUser?.user_metadata) {
        const { role } = currentUser.user_metadata;
        
        set({
          isAdmin: role === 'super_admin' || role === 'admin',
          isDoctor: role === 'doctor',
          isNurse: role === 'nurse',
          isReceptionist: role === 'receptionist'
        });
      }
      
      if (currentUser?.user_metadata?.hospital_id) {
        await get().fetchCurrentHospital();
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
      if (error.status === 403 || error.message.includes('user_not_found')) {
        await get().logout();
      }
    }
  },
  
  fetchCurrentHospital: async () => {
    try {
      const { user } = get();
      if (!user) return;
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        if (userError.status === 403 || userError.message.includes('user_not_found')) {
          await get().logout();
        }
        throw userError;
      }
      
      const hospitalId = currentUser?.user_metadata?.hospital_id;
      
      if (hospitalId) {
        const { data: hospital, error: hospitalError } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', hospitalId)
          .single();
        
        if (hospitalError) {
          console.error('Error fetching hospital:', hospitalError);
          return;
        }
        
        if (hospital) {
          set({ hospital });
          localStorage.setItem(`hospitals_${hospital.id}`, JSON.stringify(hospital));
        }
      }
    } catch (error: any) {
      console.error('Error fetching hospital:', error.message);
      if (error.status === 403 || error.message.includes('user_not_found')) {
        await get().logout();
      }
    }
  }
}));

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  notifiedEmergencies: new Set<string>(),
  
  addNotification: (notification) => {
    const id = uuidv4();
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