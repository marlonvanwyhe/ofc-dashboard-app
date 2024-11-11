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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">
            {isEditing ? 'Edit Team' : 'Create New Team'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign Coach
            </label>
            <select
              value={formData.coachId}
              onChange={(e) => onChange({ ...formData, coachId: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Players
            </label>
            <div className="border dark:border-gray-600 rounded-lg divide-y dark:divide-gray-600">
              <div className="max-h-60 overflow-y-auto">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className={`flex items-center p-3 cursor-pointer transition-colors ${
                      formData.players.includes(player.id)
                        ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
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
                      className="form-checkbox h-5 w-5 text-checkbox border-gray-300 rounded focus:ring-checkbox"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block font-medium dark:text-white">
                        {player.name}
                      </span>
                      {player.playerNumber && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          #{player.playerNumber}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
                {players.length === 0 && (
                  <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No players available
                  </p>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Selected: {formData.players.length} players
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}