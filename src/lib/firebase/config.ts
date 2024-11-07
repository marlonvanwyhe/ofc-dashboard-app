import { FirebaseOptions } from 'firebase/app';
import { FirestoreSettings } from 'firebase/firestore';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAUjcSQkfue7JaCBY_BIBgIn8UR8SEDCTY",
  authDomain: "originfc-dashboard.firebaseapp.com",
  projectId: "originfc-dashboard",
  storageBucket: "originfc-dashboard.appspot.com",
  messagingSenderId: "147313699134",
  appId: "1:147313699134:web:d95163a80f998fdb80a46f"
};

export const firestoreSettings: FirestoreSettings = {
  cacheSizeBytes: 40000000,
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true
};

export const emulatorConfig = {
  auth: {
    host: 'localhost',
    port: 9099
  },
  firestore: {
    host: 'localhost',
    port: 8080
  },
  storage: {
    host: 'localhost',
    port: 9199
  }
};