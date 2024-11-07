import React from 'react';
import { Users } from 'lucide-react';
import { Team, Player } from '../../types';
import TeamCard from './TeamCard';

interface TeamsListProps {
  teams: Team[];
  players: Player[];
}

export default function TeamsList({ teams, players }: TeamsListProps) {
  if (teams.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No teams assigned yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {teams.map(team => (
        <TeamCard 
          key={team.id}
          team={team}
          players={players.filter(player => team.players?.includes(player.id))}
        />
      ))}
    </div>
  );
}