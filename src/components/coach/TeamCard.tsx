import React from 'react';
import { Users } from 'lucide-react';
import { Team, Player } from '../../types';

interface TeamCardProps {
  team: Team;
  players: Player[];
}

export default function TeamCard({ team, players }: TeamCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg dark:text-white">{team.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {players.length} Players
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {players.map(player => (
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
        {players.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No players assigned
          </p>
        )}
      </div>
    </div>
  );
}