import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './init';
import { testConnection } from './db';
import { handleError } from './error';
import toast from 'react-hot-toast';

interface ConnectivityState {
  isOnline: boolean;
  isAuthenticated: boolean;
  retryCount: number;
}

const state: ConnectivityState = {
  isOnline: navigator.onLine,
  isAuthenticated: false,
  retryCount: 0
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const initializeConnectivity = () => {
  // Monitor online/offline status
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Monitor authentication status
  onAuthStateChanged(auth, (user) => {
    state.isAuthenticated = !!user;
  });

  // Initial connection test
  checkConnection();
};

const handleOnline = async () => {
  state.isOnline = true;
  await checkConnection();
};

const handleOffline = () => {
  state.isOnline = false;
  toast.error('You are offline. Changes will sync when connection is restored');
};

const checkConnection = async () => {
  if (!state.isOnline) return;

  try {
    const connected = await testConnection();
    if (connected) {
      state.retryCount = 0;
      if (!state.isOnline) {
        toast.success('Connection restored');
        state.isOnline = true;
      }
    } else {
      await retryConnection();
    }
  } catch (err) {
    handleError('Connection error', err);
    await retryConnection();
  }
};

const retryConnection = async () => {
  if (state.retryCount >= MAX_RETRIES) {
    handleError('Unable to establish connection. Please check your internet connection');
    return;
  }

  state.retryCount++;
  setTimeout(checkConnection, RETRY_DELAY * state.retryCount);
};

export const getConnectionStatus = () => ({
  isOnline: state.isOnline,
  isAuthenticated: state.isAuthenticated
});