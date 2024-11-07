import { app, auth, db, storage } from './init';
import { connectEmulators } from './emulators';
import { initializeOfflineSupport } from './offline';
import { initializeConnectivity } from './connectivity';
import { handleError } from './error';

// Initialize Firebase services
connectEmulators();
initializeConnectivity();

// Initialize offline support
initializeOfflineSupport().catch(err => 
  handleError('Error initializing offline support', err)
);

export {
  app,
  auth,
  db,
  storage,
  handleError
};