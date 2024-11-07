import React from 'react';
import { Users, UserCheck, Trophy } from 'lucide-react';
import { Team, Player, AttendanceRecord } from '../../types';

interface DashboardStatsProps {
  teams: Team[];
  players: Player[];
  attendance: AttendanceRecord[];
}

interface PlayerStats {
  id: string;
  name: string;
  averageRating: number;
  playerNumber?: string;
}

export default function DashboardStats({ teams, players, attendance }: DashboardStatsProps) {
  // Calculate attendance rate
  const totalSessions = attendance.length;
  const presentSessions = attendance.filter(record => record.present).length;
  const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

  // Calculate player ratings and get top performers
  const playerStats = players.map(player => {
    const playerRecords = attendance.filter(record => 
      record.playerId === player.id && typeof record.rating === 'number'
    );
    
    const averageRating = playerRecords.length > 0
      ? playerRecords.reduce((sum, record) => sum + (record.rating || 0), 0) / playerRecords.length
      : 0;
    
    return {
      id: player.id,
      name: player.name,
      playerNumber: player.playerNumber,
      averageRating
    };
  });

  const topPlayers = playerStats
    .filter(player => player.averageRating > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white">Total Players</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {players.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Across {teams.length} team{teams.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white">Team Attendance</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {attendanceRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last 30 days
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white">Top Players</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By performance rating
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {topPlayers.length > 0 ? (
            topPlayers.map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    'text-amber-600'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="font-medium dark:text-white">
                    {player.name}
                    {player.playerNumber && ` (#${player.playerNumber})`}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {player.averageRating.toFixed(1)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No rated players yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}