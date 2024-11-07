import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Team, Player, AttendanceRecord } from '../../types';
import { Users, Star, Calendar, Trophy } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

interface PlayerStats {
  id: string;
  name: string;
  averageRating: number;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalSessions: 0,
    presentCount: 0,
    attendanceRate: 0
  });
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (!user?.profileId) return;

      try {
        // Fetch teams assigned to the coach
        const teamsQuery = query(
          collection(db, 'teams'),
          where('coachId', '==', user.profileId)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        setTeams(teamsData);

        // Get all player IDs from all teams
        const allPlayerIds = teamsData.reduce((acc: string[], team) => {
          return [...acc, ...(team.players || [])];
        }, []);

        // Remove duplicates
        const uniquePlayerIds = [...new Set(allPlayerIds)];

        if (uniquePlayerIds.length > 0) {
          // Fetch players data
          const playersQuery = query(
            collection(db, 'players'),
            where('teamId', 'in', teamsData.map(team => team.id))
          );
          const playersSnapshot = await getDocs(playersQuery);
          const playersData = playersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Player[];
          setPlayers(playersData);

          // Fetch attendance records for all players
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('playerId', 'in', uniquePlayerIds),
            orderBy('date', 'desc')
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AttendanceRecord[];

          // Calculate attendance stats
          const totalSessions = attendanceRecords.length;
          const presentCount = attendanceRecords.filter(record => record.present).length;
          const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

          setAttendanceStats({
            totalSessions,
            presentCount,
            attendanceRate
          });

          // Calculate player ratings
          const playerStats = uniquePlayerIds.map(playerId => {
            const player = playersData.find(p => p.id === playerId);
            const playerRecords = attendanceRecords.filter(record => record.playerId === playerId);
            const ratings = playerRecords.map(record => record.rating || 0);
            const averageRating = ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
              : 0;

            return {
              id: playerId,
              name: player?.name || 'Unknown Player',
              averageRating
            };
          });

          // Get top 3 players by rating
          const topRatedPlayers = playerStats
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 3);

          setTopPlayers(topRatedPlayers);
        }
      } catch (error) {
        console.error('Error fetching coach data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Coach Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Players Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Total Players</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {players.length}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Stats Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Attendance Rate</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {attendanceStats.attendanceRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {attendanceStats.presentCount} of {attendanceStats.totalSessions} sessions
              </p>
            </div>
          </div>
        </div>

        {/* Top Players Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold dark:text-white">Top Performers</h3>
          </div>
          <div className="space-y-2">
            {topPlayers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    'text-amber-600'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="dark:text-white">{player.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium dark:text-gray-300">
                    {player.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
            {topPlayers.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No player ratings yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
          const teamPlayers = players.filter(p => p.teamId === team.id);
          return (
            <div key={team.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">{team.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {teamPlayers.length} Players
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {teamPlayers.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="dark:text-white">{player.name}</span>
                    {player.playerNumber && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        #{player.playerNumber}
                      </span>
                    )}
                  </div>
                ))}
                {teamPlayers.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                    No players assigned
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {teams.length === 0 && (
          <div className="col-span-full text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Teams Assigned</h3>
            <p className="text-gray-500 dark:text-gray-400">You haven't been assigned to any teams yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}