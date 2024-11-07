import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from './init';
import { handleError } from './error';
import toast from 'react-hot-toast';

export const initializeOfflineSupport = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence enabled');
    
    // Listen for online/offline status
    window.addEventListener('online', () => {
      toast.success('Connection restored');
    });
    
    window.addEventListener('offline', () => {
      toast.error('You are offline. Changes will sync when connection is restored');
    });
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      handleError('Multiple tabs open. Offline mode limited to one tab.', err);
    } else if (err.code === 'unimplemented') {
      handleError('Browser doesn\'t support offline storage', err);
    } else {
      handleError('Error initializing offline support', err);
    }
  }
};