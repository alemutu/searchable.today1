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

// Add operation to queue
const addToQueue = (operation: StorageOperation): void => {
  operationsQueue.push(operation);
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
      // Add failed operation back to queue
      addToQueue(op);
    }
  }
};

// Generic save function that works with both local and remote storage
export const saveData = async <T extends object>(
  table: string,
  data: T,
  id?: string
): Promise<T> => {
  // Save to local storage first
  const localStorageKey = `${table}_${id || (data as any).id || 'new'}`;
  localStorage.setItem(localStorageKey, JSON.stringify(data));
  
  // If online, save to Supabase
  if (isOnline()) {
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
  // Try to get from local storage first
  if (id) {
    const localData = localStorage.getItem(`${table}_${id}`);
    if (localData) {
      return JSON.parse(localData) as T;
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