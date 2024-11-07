import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Player, AttendanceRecord, Invoice } from '../types';
import toast from 'react-hot-toast';

export function usePlayerData(playerId: string | undefined) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerData = useCallback(async () => {
    if (!playerId) {
      setError('Invalid player ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch player data
      const playerRef = doc(db, 'players', playerId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        setError('Player not found');
        setLoading(false);
        return;
      }

      const playerData = playerDoc.data();
      const player: Player = {
        id: playerDoc.id,
        name: playerData.name || '',
        email: playerData.email || '',
        phone: playerData.phone || '',
        playerNumber: playerData.playerNumber || '',
        teamId: playerData.teamId || '',
        guardianName: playerData.guardianName || '',
        guardianContact: playerData.guardianContact || '',
        imageUrl: playerData.imageUrl || '',
        address: playerData.address || '',
        createdAt: playerData.createdAt || new Date().toISOString(),
        updatedAt: playerData.updatedAt || null
      };

      setPlayer(player);

      // Fetch attendance records
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('playerId', '==', playerId),
        orderBy('date', 'desc'),
        limit(50)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        playerId: doc.data().playerId,
        date: doc.data().date,
        present: Boolean(doc.data().present),
        rating: Number(doc.data().rating) || 0,
        notes: doc.data().notes || '',
        createdAt: doc.data().createdAt || new Date().toISOString()
      }));

      setAttendanceRecords(attendanceData);

      // Fetch invoices
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('playerId', '==', playerId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        playerId: doc.data().playerId,
        invoiceNumber: doc.data().invoiceNumber,
        amount: Number(doc.data().amount) || 0,
        dueDate: doc.data().dueDate,
        description: doc.data().description || '',
        status: doc.data().status || 'outstanding',
        items: Array.isArray(doc.data().items) ? doc.data().items : [],
        createdAt: doc.data().createdAt || new Date().toISOString(),
        updatedAt: doc.data().updatedAt || null
      }));

      setInvoices(invoicesData);
    } catch (err: any) {
      console.error('Error fetching player data:', err);
      setError(err.message || 'Failed to load player data');
      toast.error(err.message || 'Failed to load player data');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  const refreshData = useCallback(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  return {
    player,
    attendanceRecords,
    invoices,
    loading,
    error,
    refreshData
  };
}