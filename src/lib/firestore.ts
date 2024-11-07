import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  addDoc,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AttendanceRecord, Invoice } from '../types';
import toast from 'react-hot-toast';

// Function to get the next invoice number
async function getNextInvoiceNumber(): Promise<string> {
  try {
    // Get the counter document
    const counterDoc = await getDoc(doc(db, 'counters', 'invoices'));
    let nextNumber = 1;

    if (counterDoc.exists()) {
      nextNumber = (counterDoc.data().current || 0) + 1;
    }

    // Update the counter
    await setDoc(doc(db, 'counters', 'invoices'), { current: nextNumber });

    // Format the invoice number with leading zeros
    return `INV-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    throw error;
  }
}

export async function getPlayerAttendance(playerId: string): Promise<AttendanceRecord[]> {
  if (!playerId) return [];

  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('playerId', '==', playerId),
      orderBy('date', 'desc'),
      limit(50)
    );

    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        playerId: data.playerId,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        present: Boolean(data.present),
        rating: Number(data.rating) || 0,
        notes: data.notes || '',
        createdAt: data.createdAt instanceof Timestamp ? 
          data.createdAt.toDate().toISOString() : 
          data.createdAt || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    toast.error('Failed to load attendance records');
    return [];
  }
}

export async function getPlayerInvoices(playerId: string): Promise<Invoice[]> {
  if (!playerId) return [];

  try {
    const invoicesRef = collection(db, 'invoices');
    const q = query(
      invoicesRef,
      where('playerId', '==', playerId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber,
        playerId: data.playerId,
        amount: Number(data.amount) || 0,
        description: data.description || '',
        dueDate: data.dueDate instanceof Timestamp ? 
          data.dueDate.toDate().toISOString() : 
          data.dueDate || new Date().toISOString(),
        status: data.status || 'pending',
        createdAt: data.createdAt instanceof Timestamp ? 
          data.createdAt.toDate().toISOString() : 
          data.createdAt || new Date().toISOString(),
        items: Array.isArray(data.items) ? data.items.map((item: any) => ({
          description: item.description || '',
          amount: Number(item.amount) || 0,
          quantity: Number(item.quantity) || 1
        })) : []
      };
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    toast.error('Failed to load invoices');
    return [];
  }
}

export async function addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<string | null> {
  try {
    const attendanceRef = collection(db, 'attendance');
    const docRef = await addDoc(attendanceRef, {
      ...record,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding attendance record:', error);
    toast.error('Failed to save attendance record');
    return null;
  }
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<string | null> {
  try {
    // Get the next invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    const invoicesRef = collection(db, 'invoices');
    const docRef = await addDoc(invoicesRef, {
      ...invoice,
      invoiceNumber,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding invoice:', error);
    toast.error('Failed to create invoice');
    return null;
  }
}