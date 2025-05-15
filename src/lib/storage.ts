import { supabase, getClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeInput } from './security';

// Type for storage operations
type StorageOperation = {
  id: string;
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
    id: uuidv4()
  };
  operationsQueue.push(operationWithId);
  saveQueue();
};

// Process the operations queue
export const processQueue = async (): Promise<void> => {
  if (!isOnline() || operationsQueue.length === 0) return;

  const client = getClient();
  
  const operations = [...operationsQueue];
  operationsQueue = [];
  saveQueue();
  
  for (const op of operations) {
    try {
      // Skip any operations targeting the cached table
      if (op.table === 'cached') continue;

      if (op.type === 'insert') {
        await client.from(op.table).insert(op.data);
      } else if (op.type === 'update' && op.id) {
        await client.from(op.table).update(op.data).eq('id', op.id);
      } else if (op.type === 'delete' && op.id) {
        await client.from(op.table).delete().eq('id', op.id);
      }
    } catch (error) {
      console.error(`Error processing operation:`, op, error);
      operationsQueue.push(op);
    }
  }
  
  if (operationsQueue.length > 0) {
    saveQueue();
  }
};

// Sanitize data to prevent XSS
const sanitizeData = <T extends object>(data: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' && item !== null ? sanitizeData(item) : 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

// Generic save function that works with both local and remote storage
export const saveData = async <T extends object>(
  table: string,
  data: T,
  id?: string
): Promise<T> => {
  // Skip operations on the cached table
  if (table === 'cached') {
    throw new Error('Direct operations on cached table are not allowed');
  }

  // Sanitize data to prevent XSS
  const sanitizedData = sanitizeData(data);
  
  // Save to local storage first with a prefix to avoid conflicts
  const localStorageKey = `storage_${table}_${id || (sanitizedData as any).id || 'new'}`;
  localStorage.setItem(localStorageKey, JSON.stringify(sanitizedData));
  
  // If online, save to Supabase
  if (isOnline()) {
    try {
      const client = getClient();
      
      if (id) {
        const { error } = await client
          .from(table)
          .update(sanitizedData)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        const { error } = await client
          .from(table)
          .insert(sanitizedData);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error saving to Supabase:`, error);
      
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
  // Skip operations on the cached table
  if (table === 'cached') {
    throw new Error('Direct operations on cached table are not allowed');
  }

  // Try to get from local storage first
  if (id) {
    const localData = localStorage.getItem(`storage_${table}_${id}`);
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
        const { data, error } = await client
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          localStorage.setItem(`storage_${table}_${id}`, JSON.stringify(data));
        }
        
        return data as T;
      } else if (query) {
        let queryBuilder = client.from(table).select('*');
        
        Object.entries(query).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        
        if (data) {
          data.forEach((item: any) => {
            if (item.id) {
              localStorage.setItem(`storage_${table}_${item.id}`, JSON.stringify(item));
            }
          });
        }
        
        return data as T[];
      } else {
        const { data, error } = await client
          .from(table)
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          data.forEach((item: any) => {
            if (item.id) {
              localStorage.setItem(`storage_${table}_${item.id}`, JSON.stringify(item));
            }
          });
        }
        
        return data as T[];
      }
    } catch (error) {
      console.error(`Error fetching from Supabase:`, error);
      
      if (id) {
        return null;
      } else {
        const results: T[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`storage_${table}_`)) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              
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
    if (id) {
      const localData = localStorage.getItem(`storage_${table}_${id}`);
      return localData ? JSON.parse(localData) as T : null;
    } else {
      const results: T[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`storage_${table}_`)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            
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
  // Skip operations on the cached table
  if (table === 'cached') {
    throw new Error('Direct operations on cached table are not allowed');
  }

  // Remove from local storage
  localStorage.removeItem(`storage_${table}_${id}`);
  
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
  
  await processQueue();
  
  const client = getClient();
  
  const tables = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('storage_')) {
      const table = key.split('_')[1];
      if (table !== 'cached') {
        tables.add(table);
      }
    }
  }
  
  for (const table of tables) {
    try {
      const localItems: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`storage_${table}_`) && key !== 'pendingOperations') {
          const id = key.split('_')[2];
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
  loadQueue();
  
  window.addEventListener('online', () => {
    console.log('Back online, processing queue...');
    processQueue();
  });
  
  if (typeof localStorage === 'undefined') {
    console.error('Local storage is not available');
  }
  
  setInterval(() => {
    cleanupOldData();
  }, 24 * 60 * 60 * 1000); // Once a day
};

// Clean up old data from localStorage
const cleanupOldData = (): void => {
  const now = Date.now();
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('storage_')) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.timestamp && (now - item.timestamp > MAX_AGE)) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Skip items that can't be parsed
      }
    }
  }
};