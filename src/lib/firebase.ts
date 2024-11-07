import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  limit,
  setLogLevel,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';

// Enable more detailed logging in development
if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}

const firebaseConfig = {
  apiKey: "AIzaSyAUjcSQkfue7JaCBY_BIBgIn8UR8SEDCTY",
  authDomain: "originfc-dashboard.firebaseapp.com",
  projectId: "originfc-dashboard",
  storageBucket: "originfc-dashboard.appspot.com",
  messagingSenderId: "147313699134",
  appId: "1:147313699134:web:d95163a80f998fdb80a46f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with optimized settings
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Storage
const storage = getStorage(app);

// Function to verify connection status
export const verifyConnection = async (retries = 3, delay = 1000): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const testQuery = query(collection(db, 'system'), limit(1));
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.warn(`Firestore connection check attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  return false;
};

// Function to handle offline/online state changes
const handleConnectivityChanges = () => {
  let wasOffline = false;

  window.addEventListener('online', async () => {
    if (wasOffline) {
      const isConnected = await verifyConnection();
      if (isConnected) {
        toast.success('Connection restored - back online');
        wasOffline = false;
      }
    }
  });

  window.addEventListener('offline', () => {
    wasOffline = true;
    toast.error('You are offline - changes will sync when connection is restored');
  });
};

// Initialize connectivity monitoring
handleConnectivityChanges();

// Export initialized services
export { auth, db, storage };