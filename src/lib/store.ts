import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  user: any | null;
  hospital: any | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, metadata?: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hospital: null,
  isLoading: false,
  error: null,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate login - in a real app, this would call supabase.auth.signInWithPassword
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock user data
      const user = {
        id: '1',
        email,
        role: email.includes('admin') ? 'admin' : 
              email.includes('doctor') ? 'doctor' : 
              email.includes('nurse') ? 'nurse' : 'user'
      };
      
      // Mock hospital data
      const hospital = {
        id: '1',
        name: 'General Hospital',
        subdomain: 'general',
        address: '123 Medical Center Dr',
        phone: '555-123-4567',
        email: 'info@generalhospital.com'
      };
      
      set({ 
        user, 
        hospital,
        isAdmin: user.role === 'admin',
        isDoctor: user.role === 'doctor',
        isNurse: user.role === 'nurse',
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      // Simulate logout - in a real app, this would call supabase.auth.signOut
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ user: null, hospital: null, isAdmin: false, isDoctor: false, isNurse: false, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  signup: async (email, password, metadata) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate signup - in a real app, this would call supabase.auth.signUp
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Don't log in the user automatically after signup
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

// Notification store types
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

// Notification store
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  notifiedEmergencies: new Set<string>(),
  
  addNotification: (notification) => {
    const id = uuidv4(); // Use UUID for secure random IDs
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