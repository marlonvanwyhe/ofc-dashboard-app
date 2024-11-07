import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserRole } from '../types';

interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  profileData?: Record<string, any>;
}

const testUsers: TestUser[] = [
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'Admin User',
    profileData: {
      position: 'System Administrator',
      phone: '+1234567890'
    }
  },
  {
    email: 'coach@test.com',
    password: 'Coach123!',
    role: 'coach',
    name: 'Test Coach',
    profileData: {
      specialization: 'Senior Coach',
      phone: '+1234567891',
      experience: '5 years'
    }
  },
  {
    email: 'player@test.com',
    password: 'Player123!',
    role: 'player',
    name: 'Test Player',
    profileData: {
      playerNumber: '10',
      phone: '+1234567892',
      guardianName: 'Parent Name',
      guardianContact: '+1234567893'
    }
  }
];

export async function initializeTestData() {
  try {
    for (const user of testUsers) {
      try {
        // Check if user already exists in Firestore
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            user.email,
            user.password
          );

          const uid = userCredential.user.uid;

          // Create base user document
          const userData = {
            email: user.email,
            role: user.role,
            name: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Create user document in users collection
          await setDoc(doc(db, 'users', uid), userData);

          // Create role-specific profile
          const profileData = {
            ...user.profileData,
            userId: uid,
            email: user.email,
            name: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Create profile based on role
          await setDoc(doc(db, `${user.role}s`, uid), profileData);

          // Update user document with profile reference
          await setDoc(doc(db, 'users', uid), {
            ...userData,
            profileId: uid
          });

          console.log(`Created ${user.role} user:`, user.email);
        } else {
          console.log(`${user.role} user already exists:`, user.email);
        }
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`User ${user.email} already exists in Auth`);
          continue;
        }
        throw error;
      }
    }

    console.log('Test data initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing test data:', error);
    throw error;
  }
}