import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord, Team, Player } from '../types';

export interface CoachStats {
  totalTeams: number;
  totalPlayers: number;
  attendanceStats: {
    totalSessions: number;
    presentCount: number;
    attendanceRate: number;
    averageRating: number;
  };
}

export function useCoachStats(coachId: string) {
  const [stats, setStats] = useState<CoachStats>({
    totalTeams: 0,
    totalPlayers: 0,
    attendanceStats: {
      totalSessions: 0,
      presentCount: 0,
      attendanceRate: 0,
      averageRating: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      if (!coachId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch teams assigned to coach
        const teamsQuery = query(
          collection(db, 'teams'),
          where('coachId', '==', coachId),
          orderBy('name')
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teams = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];

        // Get all players in coach's teams
        const playersQuery = query(
          collection(db, 'players'),
          where('teamId', 'in', teams.map(team => team.id))
        );
        const playersSnapshot = await getDocs(playersQuery);
        const players = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        // Calculate attendance stats only if there are players
        let attendanceStats = {
          totalSessions: 0,
          presentCount: 0,
          attendanceRate: 0,
          averageRating: 0
        };

        if (players.length > 0) {
          // Fetch attendance records for all players
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('playerId', 'in', players.map(p => p.id)),
            orderBy('date', 'desc')
          );

          const attendanceSnapshot = await getDocs(attendanceQuery);
          const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AttendanceRecord[];

          const totalSessions = attendanceRecords.length;
          const presentCount = attendanceRecords.filter(record => record.present).length;
          const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

          // Calculate average rating from valid ratings only
          const validRatings = attendanceRecords.filter(record => record.rating && record.rating > 0);
          const averageRating = validRatings.length > 0
            ? validRatings.reduce((sum, record) => sum + (record.rating || 0), 0) / validRatings.length
            : 0;

          attendanceStats = {
            totalSessions,
            presentCount,
            attendanceRate,
            averageRating
          };
        }

        setStats({
          totalTeams: teams.length,
          totalPlayers: players.length,
          attendanceStats
        });
      } catch (error) {
        console.error('Error calculating coach stats:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [coachId]);

  return { stats, loading };
}