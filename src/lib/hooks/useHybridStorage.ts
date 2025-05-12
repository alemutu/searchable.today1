import { useState, useEffect, useCallback } from 'react';
import { saveData, fetchData, deleteData } from '../storage';

// Generic hook for hybrid storage operations
export function useHybridStorage<T extends object>(
  table: string,
  initialQuery?: { [key: string]: any }
) {
  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data
  const fetchItems = useCallback(async (query?: { [key: string]: any }) => {
    setLoading(true);
    try {
      const result = await fetchData<T>(table, undefined, query || initialQuery);
      setData(result);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [table, initialQuery]);

  // Fetch a single item by ID
  const fetchById = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const result = await fetchData<T>(table, id);
      setData(result);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${table} by ID:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [table]);

  // Save an item
  const saveItem = useCallback(async (item: T, id?: string): Promise<T> => {
    setLoading(true);
    try {
      const result = await saveData<T>(table, item, id);
      
      // Update local state
      if (Array.isArray(data)) {
        if (id) {
          // Update existing item in array
          setData(data.map(d => (d as any).id === id ? result : d));
        } else {
          // Add new item to array
          setData([...data, result]);
        }
      } else {
        // Single item case
        setData(result);
      }
      
      setError(null);
      return result;
    } catch (err) {
      console.error(`Error saving ${table}:`, err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table, data]);

  // Delete an item
  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await deleteData(table, id);
      
      // Update local state
      if (Array.isArray(data)) {
        setData(data.filter(item => (item as any).id !== id));
      } else if (data && (data as any).id === id) {
        setData(null);
      }
      
      setError(null);
    } catch (err) {
      console.error(`Error deleting ${table}:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [table, data]);

  // Load data on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    data,
    loading,
    error,
    fetchItems,
    fetchById,
    saveItem,
    deleteItem
  };
}