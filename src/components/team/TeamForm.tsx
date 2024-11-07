import React from 'react';
import { X } from 'lucide-react';
import { Coach, Player } from '../../types';

interface TeamFormData {
  name: string;
  coachId: string;
  players: string[];
}

interface TeamFormProps {
  formData: TeamFormData;
  coaches: Coach[];
  players: Player[];
  loading: boolean;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: TeamFormData) => void;
  onClose: () => void;
}

export default function TeamForm({
  formData,
  coaches,
  players,
  loading,
  isEditing,
  onSubmit,
  onChange,
  onClose
}: TeamFormProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {isEditing ? 'Edit Team' : 'Create New Team'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                onChange({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Coach
            </label>
            <select
              value={formData.coachId}
              onChange={(e) =>
                onChange({ ...formData, coachId: e.target.value })
              }
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Select a coach</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Players
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
              {players.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-2 p-1 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.players.includes(player.id)}
                    onChange={(e) => {
                      const updatedPlayers = e.target.checked
                        ? [...formData.players, player.id]
                        : formData.players.filter((id) => id !== player.id);
                      onChange({ ...formData, players: updatedPlayers });
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {player.name}
                </label>
              ))}
              {players.length === 0 && (
                <p className="text-sm text-gray-500 p-2">No players available</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Team' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
}