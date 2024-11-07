import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth,
  User,
  sendPasswordResetEmail,
  Auth
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import toast from 'react-hot-toast';
import { UserRole } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  profileId?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  profileData: Record<string, any>;
}

export async function createAuthUser(userData: CreateUserData): Promise<string> {
  try {
    // Validate email format
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const uid = userCredential.user.uid;

    // Create base user document
    const userDoc = {
      email: userData.email,
      role: userData.role,
      name: userData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileId: uid // Set profileId to the same as uid
    };

    // Create user document in users collection
    await setDoc(doc(db, 'users', uid), userDoc);

    // Create role-specific profile
    const profileData = {
      ...userData.profileData,
      id: uid,
      email: userData.email,
      name: userData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create profile based on role - using correct "coaches" collection
    const collectionName = userData.role === 'coach' ? 'coaches' : `${userData.role}s`;
    const profileRef = doc(db, collectionName, uid);
    await setDoc(profileRef, profileData);

    return uid;
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password accounts are not enabled. Please contact support.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    }

    // If it's our custom error, throw it as is
    if (error.message) {
      throw new Error(error.message);
    }

    // Generic error
    throw new Error('Failed to create user. Please try again.');
  }
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();

    return {
      id: user.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      profileId: userData.profileId
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    }
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

export async function signOut(auth: Auth): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  try {
    // Check if there's a current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      await signOut(auth);
      throw new Error('Please sign in again to update passwords');
    }

    // Get the current user's role
    const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!adminDoc.exists()) {
      throw new Error('Admin user data not found');
    }

    const adminData = adminDoc.data();
    if (adminData.role !== 'admin') {
      throw new Error('Only administrators can update passwords');
    }

    // Get the target user's data
    const targetUserDoc = await getDoc(doc(db, 'users', userId));
    if (!targetUserDoc.exists()) {
      throw new Error('Target user not found');
    }

    const targetUserData = targetUserDoc.data();

    // Send password reset email
    await sendPasswordResetEmail(auth, targetUserData.email);

    // Track the password reset request
    await updateDoc(doc(db, 'users', userId), {
      passwordResetRequested: true,
      passwordResetRequestedAt: new Date().toISOString(),
      passwordResetRequestedBy: currentUser.uid,
      updatedAt: new Date().toISOString()
    });

    return;
  } catch (error: any) {
    let errorMessage = 'Failed to process password reset';
    
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please sign in again to perform this action';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found';
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized for password reset';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error updating password:', {
      code: error.code,
      message: error.message,
      fullError: error
    });

    throw new Error(errorMessage);
  }
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return { valid: true };
}