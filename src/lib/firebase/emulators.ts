import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { emulatorConfig } from './config';
import { auth, db, storage } from './init';

export function connectEmulators() {
  try {
    // Connect Auth emulator
    connectAuthEmulator(auth, 
      `http://${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`,
      { disableWarnings: true }
    );

    // Connect Firestore emulator
    connectFirestoreEmulator(
      db,
      emulatorConfig.firestore.host,
      emulatorConfig.firestore.port
    );

    // Connect Storage emulator
    connectStorageEmulator(
      storage,
      emulatorConfig.storage.host,
      emulatorConfig.storage.port
    );

    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.error('Error connecting to emulators:', error);
  }
}