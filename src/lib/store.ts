import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Auth store types
interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  hospital: Hospital | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, metadata?: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setHospital: (hospital: Hospital | null) => void;
}

interface User {
  id: string;
  email: string;
  role?: string;
}

interface Hospital {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email?: string;
  logo_url?: string;
}

// Auth store
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true, // Set to true by default for testing
  isAdmin: true, // Set to true by default for testing
  user: {  // Add a default user for testing
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin'
  },
  hospital: {  // Add a default hospital for testing
    id: 'test-hospital-id',
    name: 'Test Hospital',
    subdomain: 'test',
    address: '123 Test St',
    phone: '123-456-7890'
  },
  login: async (email, password) => {
    // Mock login for development
    set({ 
      isAuthenticated: true, 
      isAdmin: true, // Set to true to allow admin access for testing
      user: { 
        id: 'mock-user-id', 
        email: email,
        role: 'admin' // Set role to admin for testing
      },
      hospital: {
        id: 'mock-hospital-id',
        name: 'Test Hospital',
        subdomain: 'test',
        address: '123 Test St',
        phone: '123-456-7890'
      }
    });
  },
  signup: async (email, password, metadata) => {
    // Mock signup for development
    set({ 
      isAuthenticated: true, 
      isAdmin: true, // Set to true to allow admin access for testing
      user: { 
        id: 'mock-user-id', 
        email: email,
        role: 'admin' // Set role to admin for testing
      },
      hospital: {
        id: 'mock-hospital-id',
        name: 'Test Hospital',
        subdomain: 'test',
        address: '123 Test St',
        phone: '123-456-7890'
      }
    });
  },
  logout: async () => {
    set({ isAuthenticated: false, isAdmin: false, user: null, hospital: null });
  },
  setUser: (user) => set({ user, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }),
  setHospital: (hospital) => set({ hospital })
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