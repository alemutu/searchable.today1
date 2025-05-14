import { supabase, getClient } from './supabase';

// Type for storage operations
type StorageOperation = {
  table: string;
  type: 'insert' | 'update' | 'delete';
  data: any;
  id?: string;
  timestamp: number;
};

// Queue for pending operations
let operationsQueue: StorageOperation[] = [];

// Load queue from localStorage on initialization
const loadQueue = (): void => {
  const savedQueue = localStorage.getItem('pendingOperations');
  if (savedQueue) {
    operationsQueue = JSON.parse(savedQueue);
  }
};

// Save queue to localStorage
const saveQueue = (): void => {
  localStorage.setItem('pendingOperations', JSON.stringify(operationsQueue));
};

// Initialize by loading the queue
loadQueue();

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Check if we're in dev mode
const isDevMode = (): boolean => {
  return localStorage.getItem('devMode') === 'true';
};

// Add operation to queue
const addToQueue = (operation: StorageOperation): void => {
  operationsQueue.push(operation);
  saveQueue();
};

// Process the operations queue
export const processQueue = async (): Promise<void> => {
  if ((!isOnline() || isDevMode()) || operationsQueue.length === 0) return;

  const client = getClient();
  
  // Process operations in order
  const operations = [...operationsQueue];
  operationsQueue = [];
  saveQueue();
  
  for (const op of operations) {
    try {
      if (op.type === 'insert') {
        await client.from(op.table).insert(op.data);
      } else if (op.type === 'update' && op.id) {
        await client.from(op.table).update(op.data).eq('id', op.id);
      } else if (op.type === 'delete' && op.id) {
        await client.from(op.table).delete().eq('id', op.id);
      }
    } catch (error) {
      console.error(`Error processing operation:`, op, error);
      // Add failed operation back to queue
      addToQueue(op);
    }
  }
};

// Generate a UUID for local storage
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generic save function that works with both local and remote storage
export const saveData = async <T extends object>(
  table: string,
  data: T,
  id?: string
): Promise<T> => {
  // If in dev mode, always use local storage
  if (isDevMode()) {
    const localData = { ...data };
    
    // Generate an ID if not provided
    if (!id && !(data as any).id) {
      (localData as any).id = generateUUID();
    } else if (id) {
      (localData as any).id = id;
    }
    
    // Add created_at if not present
    if (!(localData as any).created_at) {
      (localData as any).created_at = new Date().toISOString();
    }
    
    // Save to local storage
    const localStorageKey = `${table}_${(localData as any).id}`;
    localStorage.setItem(localStorageKey, JSON.stringify(localData));
    
    console.log(`[DEV MODE] Saved to local storage: ${table}`, localData);
    return localData as T;
  }
  
  // Save to local storage first
  const localStorageKey = `${table}_${id || (data as any).id || 'new'}`;
  localStorage.setItem(localStorageKey, JSON.stringify(data));
  
  // If online, save to Supabase
  if (isOnline() && !isDevMode()) {
    try {
      const client = getClient();
      
      if (id) {
        // Update existing record
        const { error } = await client
          .from(table)
          .update(data)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await client
          .from(table)
          .insert(data);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error saving to Supabase:`, error);
      
      // Add to queue for later sync
      addToQueue({
        table,
        type: id ? 'update' : 'insert',
        data,
        id,
        timestamp: Date.now()
      });
      
      throw error;
    }
  } else {
    // Add to queue for later sync
    addToQueue({
      table,
      type: id ? 'update' : 'insert',
      data,
      id,
      timestamp: Date.now()
    });
  }
  
  return data;
};

// Generic fetch function that works with both local and remote storage
export const fetchData = async <T>(
  table: string,
  id?: string,
  query?: any
): Promise<T | T[] | null> => {
  // If in dev mode, always use local storage
  if (isDevMode()) {
    if (id) {
      const localData = localStorage.getItem(`${table}_${id}`);
      return localData ? JSON.parse(localData) as T : null;
    } else {
      // Return all items for this table from local storage
      const results: T[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${table}_`)) {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Apply query filter if provided
          if (query) {
            let matches = true;
            Object.entries(query).forEach(([queryKey, queryValue]) => {
              if (item[queryKey] !== queryValue) {
                matches = false;
              }
            });
            
            if (matches) {
              results.push(item as T);
            }
          } else {
            results.push(item as T);
          }
        }
      }
      console.log(`[DEV MODE] Fetched from local storage: ${table}`, results);
      return results;
    }
  }
  
  // Try to get from local storage first
  if (id) {
    const localData = localStorage.getItem(`${table}_${id}`);
    if (localData) {
      return JSON.parse(localData) as T;
    }
  }
  
  // If online, try to fetch from Supabase
  if (isOnline() && !isDevMode()) {
    try {
      const client = getClient();
      
      if (id) {
        // Fetch single record
        const { data, error } = await client
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Save to local storage
        if (data) {
          localStorage.setItem(`${table}_${id}`, JSON.stringify(data));
        }
        
        return data as T;
      } else if (query) {
        // Fetch with query
        let queryBuilder = client.from(table).select('*');
        
        // Apply query parameters
        Object.entries(query).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        
        // Save to local storage
        if (data) {
          data.forEach((item: any) => {
            if (item.id) {
              localStorage.setItem(`${table}_${item.id}`, JSON.stringify(item));
            }
          });
        }
        
        return data as T[];
      } else {
        // Fetch all records
        const { data, error } = await client
          .from(table)
          .select('*');
          
        if (error) throw error;
        
        // Save to local storage
        if (data) {
          data.forEach((item: any) => {
            if (item.id) {
              localStorage.setItem(`${table}_${item.id}`, JSON.stringify(item));
            }
          });
        }
        
        return data as T[];
      }
    } catch (error) {
      console.error(`Error fetching from Supabase:`, error);
      
      // Fall back to local storage
      if (id) {
        return null;
      } else {
        // Return all items for this table from local storage
        const results: T[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${table}_`)) {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            
            // Apply query filter if provided
            if (query) {
              let matches = true;
              Object.entries(query).forEach(([queryKey, queryValue]) => {
                if (item[queryKey] !== queryValue) {
                  matches = false;
                }
              });
              
              if (matches) {
                results.push(item as T);
              }
            } else {
              results.push(item as T);
            }
          }
        }
        return results;
      }
    }
  } else {
    // Offline mode - use local storage only
    if (id) {
      const localData = localStorage.getItem(`${table}_${id}`);
      return localData ? JSON.parse(localData) as T : null;
    } else {
      // Return all items for this table from local storage
      const results: T[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${table}_`)) {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Apply query filter if provided
          if (query) {
            let matches = true;
            Object.entries(query).forEach(([queryKey, queryValue]) => {
              if (item[queryKey] !== queryValue) {
                matches = false;
              }
            });
            
            if (matches) {
              results.push(item as T);
            }
          } else {
            results.push(item as T);
          }
        }
      }
      return results;
    }
  }
};

// Delete data from storage
export const deleteData = async (
  table: string,
  id: string
): Promise<void> => {
  // If in dev mode, just remove from local storage
  if (isDevMode()) {
    localStorage.removeItem(`${table}_${id}`);
    console.log(`[DEV MODE] Deleted from local storage: ${table}_${id}`);
    return;
  }
  
  // Remove from local storage
  localStorage.removeItem(`${table}_${id}`);
  
  // If online, delete from Supabase
  if (isOnline() && !isDevMode()) {
    try {
      const client = getClient();
      const { error } = await client
        .from(table)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting from Supabase:`, error);
      
      // Add to queue for later sync
      addToQueue({
        table,
        type: 'delete',
        data: {},
        id,
        timestamp: Date.now()
      });
      
      throw error;
    }
  } else {
    // Add to queue for later sync
    addToQueue({
      table,
      type: 'delete',
      data: {},
      id,
      timestamp: Date.now()
    });
  }
};

// Sync all local data with Supabase
export const syncAllData = async (): Promise<void> => {
  if (!isOnline() || isDevMode()) return;
  
  // Process the operations queue first
  await processQueue();
  
  // Then sync any data that might have been missed
  const client = getClient();
  
  // Get all keys from localStorage
  const tables = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('_')) {
      const table = key.split('_')[0];
      tables.add(table);
    }
  }
  
  // Sync each table
  for (const table of tables) {
    try {
      // Get all items for this table from local storage
      const localItems: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${table}_`) && key !== 'pendingOperations') {
          const id = key.split('_')[1];
          if (id && id !== 'new') {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            localItems.push(item);
          }
        }
      }
      
      // Sync each item
      for (const item of localItems) {
        if (item.id) {
          await client
            .from(table)
            .upsert(item, { onConflict: 'id' });
        }
      }
    } catch (error) {
      console.error(`Error syncing table ${table}:`, error);
    }
  }
};

// Initialize storage
export const initializeStorage = (): void => {
  // Load the operations queue
  loadQueue();
  
  // Set up online/offline event listeners
  window.addEventListener('online', () => {
    console.log('Back online, processing queue...');
    processQueue();
  });
  
  // Check if local storage is available
  if (typeof localStorage === 'undefined') {
    console.error('Local storage is not available');
  }
};

// Clear all local storage data for a specific table
export const clearTableData = (table: string): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${table}_`)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[DEV MODE] Cleared all data for table: ${table}`);
};

// Clear all local storage data
export const clearAllData = (): void => {
  localStorage.clear();
  console.log('[DEV MODE] Cleared all local storage data');
};

// Generate mock data for development
export const generateMockData = (): void => {
  // Generate mock patients
  const mockPatients = [
    {
      id: generateUUID(),
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1980-05-15',
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
      hospital_id: 'dev-hospital-id',
      status: 'active',
      current_flow_step: 'registration',
      priority_level: 'normal',
      created_at: new Date().toISOString()
    },
    {
      id: generateUUID(),
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1992-08-22',
      gender: 'Female',
      contact_number: '555-4321',
      email: 'jane.smith@example.com',
      address: '456 Oak Ave',
      emergency_contact: {
        name: 'John Smith',
        relationship: 'Husband',
        phone: '555-8765'
      },
      medical_info: {
        allergies: [],
        chronicConditions: [],
        currentMedications: []
      },
      hospital_id: 'dev-hospital-id',
      status: 'active',
      current_flow_step: 'registration',
      priority_level: 'normal',
      created_at: new Date().toISOString()
    }
  ];
  
  // Save mock patients to local storage
  mockPatients.forEach(patient => {
    localStorage.setItem(`patients_${patient.id}`, JSON.stringify(patient));
  });
  
  console.log('[DEV MODE] Generated mock data');
};