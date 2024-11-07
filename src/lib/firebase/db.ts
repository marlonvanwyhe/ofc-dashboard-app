import { 
  getFirestore, 
  enableIndexedDbPersistence,
  initializeFirestore,
  connectFirestoreEmulator,
  collection,
  query,
  getDocs,
  limit
} from 'firebase/firestore';
import { app } from './init';
import { firestoreSettings } from './config';
import { handleError } from './error';

// Initialize Firestore with custom settings
export const db = initializeFirestore(app, {
  ...firestoreSettings
});

// Enable offline persistence
export const initializeFirestore = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Firestore offline persistence enabled');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      handleError('Multiple tabs open. Offline mode limited to one tab.', err);
    } else if (err.code === 'unimplemented') {
      handleError('Browser doesn\'t support offline storage', err);
    } else {
      handleError('Error initializing Firestore', err);
    }
  }
};

// Test connection to Firestore
export const testConnection = async (): Promise<boolean> => {
  try {
    const testQuery = query(collection(db, 'system'), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (err) {
    handleError('Unable to connect to Firestore', err);
    return false;
  }
};

// Connect to emulator in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}