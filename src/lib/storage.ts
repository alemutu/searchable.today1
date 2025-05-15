import { supabase, getClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Type for storage operations
type StorageOperation = {
  id: string; // Add unique ID for each operation
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
    try {
      operationsQueue = JSON.parse(savedQueue);
    } catch (e) {
      console.error('Error parsing pending operations:', e);
      operationsQueue = [];
    }
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

// Add operation to queue
const addToQueue = (operation: Omit<StorageOperation, 'id'>): void => {
  const operationWithId = {
    ...operation,
    id: uuidv4() // Add unique ID to each operation
  };
  operationsQueue.push(operationWithId);
  saveQueue();
};

// Process the operations queue
export const processQueue = async (): Promise<void> => {
  if (!isOnline() || operationsQueue.length === 0) return;

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
      // Add failed operation back to queue with its original ID
      operationsQueue.push(op);
    }
  }
  
  // Save any operations that failed back to the queue
  if (operationsQueue.length > 0) {
    saveQueue();
  }
};

// Generic save function that works with both local and remote storage
export const saveData = async <T extends object>(
  table: string,
  data: T,
  id?: string
): Promise<T> => {
  // Sanitize data to prevent XSS
  const sanitizedData = sanitizeData(data);
  
  // Save to local storage first
  const localStorageKey = `${table}_${id || (sanitizedData as any).id || 'new'}`;
  localStorage.setItem(localStorageKey, JSON.stringify(sanitizedData));
  
  // If online, save to Supabase
  if (isOnline()) {
    try {
      const client = getClient();
      
      if (id) {
        // Update existing record
        const { error } = await client
          .from(table)
          .update(sanitizedData)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await client
          .from(table)
          .insert(sanitizedData);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error saving to Supabase:`, error);
      
      // Add to queue for later sync
      addToQueue({
        table,
        type: id ? 'update' : 'insert',
        data: sanitizedData,
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
      data: sanitizedData,
      id,
      timestamp: Date.now()
    });
  }
  
  return sanitizedData;
};

// Generic fetch function that works with both local and remote storage
export const fetchData = async <T>(
  table: string,
  id?: string,
  query?: any
): Promise<T | T[] | null> => {
  // Try to get from local storage first
  if (id) {
    const localData = localStorage.getItem(`${table}_${id}`);
    if (localData) {
      try {
        return JSON.parse(localData) as T;
      } catch (e) {
        console.error('Error parsing local data:', e);
      }
    }
  }
  
  // If online, try to fetch from Supabase
  if (isOnline()) {
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
            try {
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
            } catch (e) {
              console.error('Error parsing local storage item:', e);
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
          try {
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
          } catch (e) {
            console.error('Error parsing local storage item:', e);
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
  // Remove from local storage
  localStorage.removeItem(`${table}_${id}`);
  
  // If online, delete from Supabase
  if (isOnline()) {
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
  if (!isOnline()) return;
  
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
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              localItems.push(item);
            } catch (e) {
              console.error('Error parsing local storage item:', e);
            }
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

// Sanitize data to prevent XSS
const sanitizeData = <T extends object>(data: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};