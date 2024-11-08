import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord, Player } from '../types';
import toast from 'react-hot-toast';

export interface DashboardStats {
  totalPlayers: number;
  totalSessions: number;
  attendanceRate: number;
  averageRating: number;
}

export function useStats(players: Player[]) {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalSessions: 0,
    attendanceRate: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(async () => {
    try {
      setLoading(true);
      const playerIds = players.map(p => p.id);
      
      if (playerIds.length === 0) {
        setStats({
          totalPlayers: 0,
          totalSessions: 0,
          attendanceRate: 0,
          averageRating: 0
        });
        return;
      }

      // Fetch attendance records only for active players
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('playerId', 'in', playerIds),
        orderBy('date', 'desc')
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(record => playerIds.includes(record.playerId)) as AttendanceRecord[];

      // Calculate attendance stats
      const totalSessions = attendanceRecords.length;
      const presentSessions = attendanceRecords.filter(record => record.present).length;
      const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

      // Calculate average rating only from valid ratings
      const validRatings = attendanceRecords.filter(record => 
        record.rating && record.rating > 0 && record.rating <= 10
      );
      const averageRating = validRatings.length > 0
        ? validRatings.reduce((sum, record) => sum + (record.rating || 0), 0) / validRatings.length
        : 0;

      setStats({
        totalPlayers: players.length,
        totalSessions,
        attendanceRate,
        averageRating
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      toast.error('Failed to update dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [players]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return { stats, loading, refreshStats: calculateStats };
}