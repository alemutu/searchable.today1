import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { initializeStorage, syncAllData, clearAllData, generateMockData } from './storage';

interface AuthState {
  user: User | null;
  hospital: Hospital | null;
  isLoading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isReceptionist: boolean;
  error: string | null;
  devMode: boolean;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, metadata: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  fetchCurrentHospital: () => Promise<void>;
  toggleDevMode: () => void;
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
  devMode: false,
  
  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Initialize storage system
      initializeStorage();
      
      // Check if dev mode is enabled in localStorage
      const devMode = localStorage.getItem('devMode') === 'true';
      set({ devMode });
      
      if (devMode) {
        // In dev mode, set up mock data
        const mockUser = {
          id: 'dev-user-id',
          email: 'dev@hms.dev',
        };
        
        const mockHospital = {
          id: 'dev-hospital-id',
          name: 'Development Hospital',
          subdomain: 'dev',
          address: '123 Dev Street',
          phone: '123-456-7890',
          email: 'dev@hms.dev',
          logo_url: '',
          patient_id_format: 'prefix_number',
          patient_id_prefix: 'DEV',
          patient_id_digits: 6,
          patient_id_auto_increment: true,
          patient_id_last_number: 0,
          domain_enabled: true
        };
        
        set({ 
          user: mockUser as User, 
          hospital: mockHospital,
          isAdmin: true,
          isDoctor: true,
          isNurse: true,
          isReceptionist: true,
          isLoading: false
        });
        
        return;
      }
      
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
        isReceptionist: false,
        devMode: false
      });
      
      // Clear dev mode in localStorage
      localStorage.removeItem('devMode');
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
          isDoctor: data.role === 'doctor' || get().devMode,
          isNurse: data.role === 'nurse' || get().devMode,
          isReceptionist: data.role === 'receptionist' || get().devMode
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
        }
      }
    } catch (error: any) {
      console.error('Error fetching hospital:', error.message);
    }
  },
  
  toggleDevMode: () => {
    const currentDevMode = get().devMode;
    set({ 
      devMode: !currentDevMode,
      isDoctor: get().isDoctor || !currentDevMode,
      isNurse: get().isNurse || !currentDevMode,
      isReceptionist: get().isReceptionist || !currentDevMode,
      isAdmin: get().isAdmin || !currentDevMode
    });
    
    // Store dev mode state in localStorage
    localStorage.setItem('devMode', (!currentDevMode).toString());
    
    // Show console message for developers
    if (!currentDevMode) {
      console.log('%c🔓 Developer Mode Enabled', 'background: #222; color: #bada55; font-size: 16px; padding: 4px;');
      console.log('You now have access to all roles and features for testing');
      
      // Set up mock data if needed
      if (localStorage.getItem('devModeInitialized') !== 'true') {
        generateMockData();
        localStorage.setItem('devModeInitialized', 'true');
      }
    } else {
      console.log('%c🔒 Developer Mode Disabled', 'background: #222; color: #ff6b6b; font-size: 16px; padding: 4px;');
      
      // Ask if user wants to clear dev data
      if (confirm('Do you want to clear all development data?')) {
        clearAllData();
        localStorage.removeItem('devModeInitialized');
      }
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