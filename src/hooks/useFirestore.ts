import { useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export function useFirestore<T extends { id: string }>(collectionName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (constraints: QueryConstraint[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setIsLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      toast.error(`Error loading ${collectionName}: ${errorMessage}`);
      setIsLoading(false);
      return [];
    }
  }, [collectionName]);

  const fetchPlayerData = useCallback(async (playerId: string) => {
    if (!playerId) return [];
    return fetchData([
      where('playerId', '==', playerId),
      orderBy('date', 'desc'),
      limit(50)
    ]);
  }, [fetchData]);

  const addDocument = useCallback(async (data: Omit<T, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
      toast.success(`${collectionName} added successfully`);
      return { id: docRef.id, ...data } as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add document';
      setError(errorMessage);
      toast.error(`Error adding ${collectionName}: ${errorMessage}`);
      setIsLoading(false);
      throw err;
    }
  }, [collectionName]);

  const updateDocument = useCallback(async (id: string, data: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setIsLoading(false);
      toast.success(`${collectionName} updated successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      toast.error(`Error updating ${collectionName}: ${errorMessage}`);
      setIsLoading(false);
      throw err;
    }
  }, [collectionName]);

  const deleteDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, collectionName, id));
      setIsLoading(false);
      toast.success(`${collectionName} deleted successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      toast.error(`Error deleting ${collectionName}: ${errorMessage}`);
      setIsLoading(false);
      throw err;
    }
  }, [collectionName]);

  return {
    isLoading,
    error,
    fetchData,
    fetchPlayerData,
    addDocument,
    updateDocument,
    deleteDocument,
  };
}