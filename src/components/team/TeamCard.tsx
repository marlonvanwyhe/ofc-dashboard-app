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
  const teamPlayers = players.filter(p => p.teamId === team.id);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg dark:text-white">{team.name}</h3>
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
              title="Edit Team"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(team)}
              className="text-red-500 hover:text-red-700"
              title="Delete Team"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Players ({teamPlayers.length})
            </h4>
          </div>
          <div className="space-y-2">
            {teamPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-sm dark:text-white">
                  {player.name}
                  {player.playerNumber && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      #{player.playerNumber}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {teamPlayers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No players assigned
              </p>
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
            window.location.reload();
          }}
        />
      )}
    </>
  );
}