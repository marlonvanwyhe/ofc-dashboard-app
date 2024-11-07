import React, { useState } from 'react';
import { Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { Team, Coach, Player } from '../../types';
import PlayerAllocationModal from './PlayerAllocationModal';

interface TeamCardProps {
  team: Team;
  coach: Coach | undefined;
  players: Player[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export default function TeamCard({ team, coach, players, onEdit, onDelete }: TeamCardProps) {
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  // Get all players assigned to this team
  const teamPlayers = players.filter(p => p.teamId === team.id);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold dark:text-white">{team.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Coach: {coach?.name || 'Unassigned'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPlayerModal(true)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              title="Manage Players"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(team)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(team)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Players: {teamPlayers.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {teamPlayers.map((player) => (
              <span
                key={player.id}
                className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-gray-300"
              >
                {player.name}
                {player.playerNumber && ` (#${player.playerNumber})`}
              </span>
            ))}
            {teamPlayers.length === 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">No players assigned</span>
            )}
          </div>
        </div>
      </div>

      {showPlayerModal && (
        <PlayerAllocationModal
          team={team}
          onClose={() => setShowPlayerModal(false)}
          onSuccess={() => {
            setShowPlayerModal(false);
            // Trigger a refresh of the team data
            window.location.reload();
          }}
        />
      )}
    </>
  );
}