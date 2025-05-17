import { v4 as uuidv4 } from 'uuid';
import { sanitizeInput } from './security';

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
  
  // Process operations in order
  const operations = [...operationsQueue];
  operationsQueue = [];
  saveQueue();
  
  for (const op of operations) {
    try {
      // In a real app, this would send data to a server
      console.log(`Processed operation: ${op.type} on ${op.table}`, op.data);
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

// Generic save function that works with local storage
export const saveData = async <T extends object>(
  table: string,
  data: T,
  id?: string
): Promise<T> => {
  // Sanitize data to prevent XSS
  const sanitizedData = sanitizeData(data);
  
  // Generate an ID if one wasn't provided
  const itemId = id || (sanitizedData as any).id || uuidv4();
  
  // Save to local storage
  const localStorageKey = `${table}_${itemId}`;
  const itemToSave = { ...sanitizedData, id: itemId };
  
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(itemToSave));
    
    // Add to queue for later sync when online
    addToQueue({
      table,
      type: id ? 'update' : 'insert',
      data: itemToSave,
      id: itemId,
      timestamp: Date.now()
    });
    
    return itemToSave as T;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error(`Failed to save data: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Generic fetch function that works with local storage
export const fetchData = async <T>(
  table: string,
  id?: string,
  query?: any
): Promise<T | T[] | null> => {
  try {
    // If fetching a specific item by ID
    if (id) {
      const localData = localStorage.getItem(`${table}_${id}`);
      if (localData) {
        try {
          return JSON.parse(localData) as T;
        } catch (e) {
          console.error('Error parsing local data:', e);
          return null;
        }
      }
      return null;
    } 
    
    // If fetching all items or with a query
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
              if (queryKey === 'search' && typeof queryValue === 'string') {
                // Special case for search - check if any string field contains the search term
                const searchTerm = queryValue.toLowerCase();
                let foundMatch = false;
                
                for (const [itemKey, itemValue] of Object.entries(item)) {
                  if (typeof itemValue === 'string' && itemValue.toLowerCase().includes(searchTerm)) {
                    foundMatch = true;
                    break;
                  }
                }
                
                if (!foundMatch) {
                  matches = false;
                }
              } else if (item[queryKey] !== queryValue) {
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
  } catch (error) {
    console.error('Error fetching from localStorage:', error);
    throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Delete data from storage
export const deleteData = async (
  table: string,
  id: string
): Promise<void> => {
  try {
    // Remove from local storage
    localStorage.removeItem(`${table}_${id}`);
    
    // Add to queue for later sync when online
    addToQueue({
      table,
      type: 'delete',
      data: {},
      id,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error deleting from localStorage:', error);
    throw new Error(`Failed to delete data: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Sync all local data
export const syncAllData = async (): Promise<void> => {
  if (!isOnline()) return;
  
  // Process the operations queue first
  await processQueue();
  
  // In a real app, this would sync with a server
  console.log('All data synchronized successfully');
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
  
  // Periodically clean up old data
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
    if (key && key.includes('_')) {
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