import React, { useState, useEffect } from 'react';
import { X, Upload, Users, Lock } from 'lucide-react';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Coach, Team } from '../../types';
import { updatePassword } from '../../lib/auth';
import toast from 'react-hot-toast';

interface EditCoachFormProps {
  coach: Coach;
  onSubmit: (data: Partial<Coach>) => Promise<void>;
  onClose: () => void;
}

export default function EditCoachForm({ coach, onSubmit, onClose }: EditCoachFormProps) {
  const [formData, setFormData] = useState({
    name: coach.name,
    email: coach.email,
    phone: coach.phone || '',
    specialization: coach.specialization || '',
    experience: coach.experience || '',
    imageUrl: coach.imageUrl || ''
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

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

        // Set initially selected teams (where coachId matches)
        const coachTeams = teamsData
          .filter(team => team.coachId === coach.id)
          .map(team => team.id);
        setSelectedTeams(coachTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      }
    };

    fetchTeams();
  }, [coach.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
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

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      await updatePassword(coach.id, '');
      toast.success('Password reset email has been sent');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update coach profile
      await onSubmit(formData);

      // Update team assignments
      const updatePromises = teams.map(team => {
        if (selectedTeams.includes(team.id)) {
          // Assign team to coach
          return updateDoc(doc(db, 'teams', team.id), { coachId: coach.id });
        } else if (team.coachId === coach.id) {
          // Remove coach from team
          return updateDoc(doc(db, 'teams', team.id), { coachId: null });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success('Coach profile and team assignments updated');
      onClose();
    } catch (error) {
      console.error('Error updating coach:', error);
      toast.error('Failed to update coach');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white">Edit Coach Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
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
                      <Users className="w-16 h-16 text-gray-400" />
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
              Specialization
            </label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Defense Coach"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Experience (Years)
            </label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assigned Teams
            </label>
            <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded-lg">
              {teams.map(team => (
                <label
                  key={team.id}
                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
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
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{team.name}</span>
                </label>
              ))}
              {teams.length === 0 && (
                <p className="p-2 text-gray-500 dark:text-gray-400 text-center">
                  No teams available
                </p>
              )}
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="flex items-center gap-2 w-full p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 justify-center border border-blue-600 dark:border-blue-400 rounded-lg"
            >
              <Lock className="w-4 h-4" />
              {resettingPassword ? 'Sending Reset Email...' : 'Reset Password'}
            </button>
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