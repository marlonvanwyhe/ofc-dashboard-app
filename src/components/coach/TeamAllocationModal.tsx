import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Team } from '../../types';
import toast from 'react-hot-toast';

interface TeamAllocationModalProps {
  coachId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamAllocationModal({ coachId, onClose, onSuccess }: TeamAllocationModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsQuery = query(collection(db, 'teams'));
        const snapshot = await getDocs(teamsQuery);
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        
        setTeams(teamsData);
        setSelectedTeams(teamsData.filter(team => team.coachId === coachId).map(team => team.id));
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [coachId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all teams that were previously assigned to this coach
      const updatePromises = teams.map(team => {
        if (selectedTeams.includes(team.id)) {
          // Assign team to coach
          return updateDoc(doc(db, 'teams', team.id), { coachId });
        } else if (team.coachId === coachId) {
          // Remove coach from team
          return updateDoc(doc(db, 'teams', team.id), { coachId: null });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success('Teams updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating teams:', error);
      toast.error('Failed to update teams');
    } finally {
      setSaving(false);
    }
  };

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
          <h3 className="text-lg font-semibold dark:text-white">Assign Teams</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {teams.length > 0 ? (
            teams.map(team => (
              <label key={team.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTeams([...selectedTeams, team.id]);
                    } else {
                      setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 dark:text-white">{team.name}</span>
              </label>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No teams available</p>
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