import React from 'react';
import { Users, Star, Calendar } from 'lucide-react';
import { Player } from '../../types';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    stats: {
      totalSessions: number;
      presentCount: number;
      attendanceRate: number;
      averageRating: number;
    };
  };
  players: Player[];
}

export function TeamCard({ team, players }: TeamCardProps) {
  const teamPlayers = players.filter(p => p.teamId === team.id);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{team.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {teamPlayers.length} Players
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {team.stats.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-green-800 dark:text-green-300">
                Attendance Rate
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {team.stats.presentCount} of {team.stats.totalSessions} sessions
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {team.stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}