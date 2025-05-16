import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Auth store types
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  hospital: Hospital | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, metadata?: any) => Promise<void>;
  setUser: (user: User | null) => void;
}

interface User {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
}

interface Hospital {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email?: string;
}

// Auth store
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  hospital: null,
  isLoading: false,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate login - in a real app, this would call supabase.auth.signInWithPassword
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock user data
      const user = {
        id: uuidv4(),
        email,
        role: email.includes('admin') ? 'admin' : 
              email.includes('doctor') ? 'doctor' : 
              email.includes('nurse') ? 'nurse' : 'user',
        first_name: email.split('@')[0],
        last_name: 'User'
      };
      
      // Mock hospital data
      const hospital = {
        id: uuidv4(),
        name: 'General Hospital',
        subdomain: 'general',
        address: '123 Medical Center Dr',
        phone: '555-123-4567',
        email: 'info@generalhospital.com'
      };
      
      set({ 
        user, 
        hospital,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isDoctor: user.role === 'doctor',
        isNurse: user.role === 'nurse',
        isLoading: false 
      });
      
      // Store user in localStorage for persistence
      localStorage.setItem('hms_user', JSON.stringify(user));
      localStorage.setItem('hms_hospital', JSON.stringify(hospital));
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
      set({ 
        user: null, 
        hospital: null, 
        isAuthenticated: false, 
        isAdmin: false, 
        isDoctor: false, 
        isNurse: false, 
        isLoading: false 
      });
      
      // Remove user from localStorage
      localStorage.removeItem('hms_user');
      localStorage.removeItem('hms_hospital');
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
      
      // Create a new user
      const user = {
        id: uuidv4(),
        email,
        role: 'user',
        first_name: metadata?.first_name || email.split('@')[0],
        last_name: metadata?.last_name || 'User'
      };
      
      // Store the user in localStorage (but don't log them in automatically)
      localStorage.setItem(`hms_registered_${email}`, JSON.stringify(user));
      
      set({ isLoading: false });
      
      // Return success
      return Promise.resolve();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isNurse: user?.role === 'nurse'
  })
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