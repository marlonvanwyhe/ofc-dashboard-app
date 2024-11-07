import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Coach } from '../types';
import toast from 'react-hot-toast';

export async function migrateCoachesCollection(): Promise<boolean> {
  try {
    // Check if there's data in the old collection
    const oldCoachesSnapshot = await getDocs(collection(db, 'coachs'));
    if (oldCoachesSnapshot.empty) {
      console.log('No coaches found in old collection');
      return false;
    }

    // Migrate each coach to the new collection while preserving IDs
    const migrationPromises = oldCoachesSnapshot.docs.map(async (docRef) => {
      const coachData = docRef.data() as Coach;
      
      // Use setDoc to maintain the same document ID
      await setDoc(doc(db, 'coaches', docRef.id), {
        ...coachData,
        migratedAt: new Date().toISOString()
      });

      // Delete the old document
      await deleteDoc(doc(db, 'coachs', docRef.id));
    });

    await Promise.all(migrationPromises);
    
    const count = oldCoachesSnapshot.docs.length;
    toast.success(`Successfully migrated ${count} coaches`);
    return true;
  } catch (error) {
    console.error('Error migrating coaches:', error);
    toast.error('Failed to migrate coaches');
    return false;
  }
}