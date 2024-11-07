import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Player, Team } from '../../types';
import toast from 'react-hot-toast';

interface PlayerAllocationModalProps {
  team: Team;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlayerAllocationModal({ team, onClose, onSuccess }: PlayerAllocationModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(team.players || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersSnapshot = await getDocs(collection(db, 'players'));
        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        players: selectedPlayers,
        updatedAt: new Date().toISOString()
      });

      // Update player documents with their team assignment
      const updatePromises = players.map(player => {
        if (selectedPlayers.includes(player.id)) {
          return updateDoc(doc(db, 'players', player.id), { teamId: team.id });
        } else if (player.teamId === team.id) {
          return updateDoc(doc(db, 'players', player.id), { teamId: null });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      
      toast.success('Players updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating players:', error);
      toast.error('Failed to update players');
    } finally {
      setSaving(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.playerNumber && player.playerNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Assign Players to {team.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map(player => (
              <label key={player.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(player.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlayers([...selectedPlayers, player.id]);
                    } else {
                      setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 dark:text-white">
                  {player.name}
                  {player.playerNumber && ` (#${player.playerNumber})`}
                </span>
              </label>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No players found</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}