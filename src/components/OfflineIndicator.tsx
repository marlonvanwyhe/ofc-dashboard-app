import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { verifyConnection } from '../lib/firebase';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [firestoreConnected, setFirestoreConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Firestore connection periodically with exponential backoff
    let checkInterval = 30000; // Start with 30 seconds
    const maxInterval = 300000; // Max 5 minutes
    let timeoutId: NodeJS.Timeout;

    const checkConnection = async () => {
      const isConnected = await verifyConnection();
      setFirestoreConnected(isConnected);

      // Adjust interval based on connection status
      if (!isConnected && checkInterval < maxInterval) {
        checkInterval = Math.min(checkInterval * 1.5, maxInterval);
      } else if (isConnected) {
        checkInterval = 30000; // Reset to initial interval when connected
      }

      timeoutId = setTimeout(checkConnection, checkInterval);
    };

    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isOffline && firestoreConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
      <WifiOff className="w-5 h-5" />
      <div>
        <p className="font-medium">
          {isOffline ? 'You are offline' : 'Connection issues detected'}
        </p>
        <p className="text-sm opacity-90">
          {isOffline 
            ? 'Changes will sync when you reconnect' 
            : 'Having trouble connecting to the server'}
        </p>
      </div>
    </div>
  );
}