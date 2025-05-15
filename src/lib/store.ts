import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, retryOperation } from './supabase';
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

// Check network connectivity
const isOnline = () => navigator.onLine;

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
      set({ isLoading: true, error: null });
      
      // Initialize storage system
      initializeStorage();
      
      if (!isOnline()) {
        console.log('Offline: Using cached session data');
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser) {
          set({ user: JSON.parse(cachedUser) });
        }
        return;
      }
      
      // Get current session with retry mechanism
      const { data: { session }, error: sessionError } = await retryOperation(
        () => supabase.auth.getSession()
      );
      
      if (sessionError) {
        if (sessionError.message.includes('JWT')) {
          await supabase.auth.signOut();
          set({ user: null });
          return;
        }
        throw sessionError;
      }
      
      if (session) {
        const { data: { user }, error: userError } = await retryOperation(
          () => supabase.auth.getUser()
        );
        
        if (userError) {
          if (userError.message.includes('user_not_found') || userError.status === 403) {
            await supabase.auth.signOut();
            set({ user: null });
            return;
          }
          throw userError;
        }
        
        if (user) {
          set({ user });
          localStorage.setItem('cached_user', JSON.stringify(user));
          await get().fetchUserProfile();
          await syncAllData();
        }
      }
    } catch (error: any) {
      console.error('Error initializing auth:', error.message);
      set({ error: `Connection error: Please check your internet connection and try again. (${error.message})` });
    } finally {
      set({ isLoading: false });
    }
  },
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!isOnline()) {
        throw new Error('Cannot login while offline');
      }
      
      const { data, error } = await retryOperation(
        () => supabase.auth.signInWithPassword({
          email,
          password
        })
      );
      
      if (error) throw error;
      
      if (data.user) {
        set({ user: data.user });
        localStorage.setItem('cached_user', JSON.stringify(data.user));
        await get().fetchUserProfile();
        await syncAllData();
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      set({ error: `Login failed: ${error.message}. Please check your credentials and try again.` });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  signup: async (email, password, metadata) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!isOnline()) {
        throw new Error('Cannot sign up while offline');
      }
      
      const { data, error } = await retryOperation(
        () => supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        })
      );
      
      if (error) throw error;
      
      if (data.user) {
        set({ user: data.user });
        localStorage.setItem('cached_user', JSON.stringify(data.user));
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
      set({ isLoading: true, error: null });
      
      if (!isOnline()) {
        set({ 
          user: null,
          hospital: null,
          isAdmin: false,
          isDoctor: false,
          isNurse: false,
          isReceptionist: false
        });
        clearSensitiveData();
        return;
      }
      
      const { error } = await retryOperation(
        () => supabase.auth.signOut()
      );
      
      if (error) {
        if (error.message.includes('Failed to fetch')) {
          console.log('Network error during logout, clearing local state');
        } else {
          throw error;
        }
      }
      
      set({ 
        user: null,
        hospital: null,
        isAdmin: false,
        isDoctor: false,
        isNurse: false,
        isReceptionist: false
      });
      
      clearSensitiveData();
      
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

      if (!isOnline()) {
        console.log('Offline: Using cached profile data');
        return;
      }

      const { data: { user: currentUser }, error: userError } = await retryOperation(
        () => supabase.auth.getUser()
      );
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        if (userError.message.includes('user_not_found') || userError.status === 403) {
          console.log('User not found in auth.users table, logging out');
          await get().logout();
          return;
        }
        throw userError;
      }

      if (!currentUser) {
        console.log('User not found in auth.users table, logging out');
        await get().logout();
        return;
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
      await get().logout();
    }
  },
  
  fetchCurrentHospital: async () => {
    try {
      const { user } = get();
      if (!user) return;

      if (!isOnline()) {
        console.log('Offline: Using cached hospital data');
        return;
      }
      
      const { data: { user: currentUser }, error: userError } = await retryOperation(
        () => supabase.auth.getUser()
      );
      
      if (userError) throw userError;
      
      const hospitalId = currentUser?.user_metadata?.hospital_id;
      
      if (hospitalId) {
        const { data: hospital, error: hospitalError } = await retryOperation(
          () => supabase
            .from('hospitals')
            .select('*')
            .eq('id', hospitalId)
            .single()
        );
        
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
    }
  }
}));

// Notification store
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