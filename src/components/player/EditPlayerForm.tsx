import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { collection, getDocs, query, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Player, Team } from '../../types';
import toast from 'react-hot-toast';

interface EditPlayerFormProps {
  player: Player;
  onSubmit: (data: Partial<Player>) => Promise<void>;
  onClose: () => void;
}

export default function EditPlayerForm({ player, onSubmit, onClose }: EditPlayerFormProps) {
  const [formData, setFormData] = useState({
    name: player.name,
    email: player.email,
    phone: player.phone || '',
    address: player.address || '',
    playerNumber: player.playerNumber || '',
    guardianName: player.guardianName || '',
    guardianContact: player.guardianContact || '',
    imageUrl: player.imageUrl || ''
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>(player.teamId || '');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsQuery = query(collection(db, 'teams'), orderBy('name'));
        const snapshot = await getDocs(teamsQuery);
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      }
    };

    fetchTeams();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData(prev => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, handle team changes
      if (selectedTeam !== player.teamId) {
        // Remove from old team if exists
        if (player.teamId) {
          const oldTeamDoc = await getDoc(doc(db, 'teams', player.teamId));
          if (oldTeamDoc.exists()) {
            const oldTeamData = oldTeamDoc.data() as Team;
            await updateDoc(doc(db, 'teams', player.teamId), {
              players: (oldTeamData.players || []).filter(id => id !== player.id)
            });
          }
        }

        // Add to new team if selected
        if (selectedTeam) {
          const newTeamDoc = await getDoc(doc(db, 'teams', selectedTeam));
          if (newTeamDoc.exists()) {
            const newTeamData = newTeamDoc.data() as Team;
            await updateDoc(doc(db, 'teams', selectedTeam), {
              players: [...(newTeamData.players || []), player.id]
            });
          }
        }
      }

      // Update player profile with new data
      const updatedData = {
        ...formData,
        teamId: selectedTeam,
        imageUrl: previewImage || formData.imageUrl,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'players', player.id), updatedData);
      await onSubmit(updatedData);

      toast.success('Player profile updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Error updating player:', error);
      toast.error(error.message || 'Failed to update player profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white">Edit Player Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {(previewImage || formData.imageUrl) ? (
                    <img
                      src={previewImage || formData.imageUrl}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Player Number
            </label>
            <input
              type="text"
              value={formData.playerNumber}
              onChange={(e) => setFormData({ ...formData, playerNumber: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team Assignment
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">No Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Guardian Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guardian Contact
                </label>
                <input
                  type="tel"
                  value={formData.guardianContact}
                  onChange={(e) => setFormData({ ...formData, guardianContact: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
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
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}