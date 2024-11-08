import React, { useState, useEffect } from 'react';
import { X, Upload, Users } from 'lucide-react';
import { createAuthUser } from '../../lib/auth';
import { UserRole, Team } from '../../types';
import PasswordField from './PasswordField';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface CreateUserFormProps {
  role: UserRole;
  onSuccess: (userId: string, userData: any) => void;
  onClose: () => void;
  formData?: {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  };
}

export default function CreateUserForm({ 
  role, 
  onSuccess, 
  onClose,
  formData = {}
}: CreateUserFormProps) {
  const [userData, setUserData] = useState({
    name: formData.name || '',
    email: formData.email || '',
    phone: formData.phone || '',
    position: formData.position || '',
    specialization: '',
    experience: '',
    imageUrl: ''
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    if (role === 'coach') {
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
    }
  }, [role]);

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
        setUserData(prev => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const additionalData = role === 'coach' ? {
        specialization: userData.specialization,
        experience: userData.experience,
        imageUrl: userData.imageUrl
      } : {
        position: userData.position
      };

      const userId = await createAuthUser({
        email: userData.email,
        password,
        name: userData.name,
        role,
        profileData: {
          ...userData,
          ...additionalData,
          createdAt: new Date().toISOString()
        }
      });

      // If this is a coach and teams were selected, update the team assignments
      if (role === 'coach' && selectedTeams.length > 0) {
        const updatePromises = selectedTeams.map(teamId =>
          updateDoc(doc(db, 'teams', teamId), { coachId: userId })
        );
        await Promise.all(updatePromises);
      }

      onSuccess(userId, {
        ...userData,
        ...additionalData,
        createdAt: new Date().toISOString()
      });
      onClose();
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white">
            Create New {role.charAt(0).toUpperCase() + role.slice(1)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'coach' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Image
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile preview"
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
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
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <PasswordField
              password={password}
              onChange={setPassword}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <PasswordField
              password={confirmPassword}
              onChange={setConfirmPassword}
              showValidation={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={userData.phone}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {role === 'coach' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={userData.specialization}
                  onChange={(e) => setUserData({ ...userData, specialization: e.target.value })}
                  placeholder="e.g., Defense Coach"
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  value={userData.experience}
                  onChange={(e) => setUserData({ ...userData, experience: e.target.value })}
                  min="0"
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign Teams
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
            </>
          )}

          {role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position
              </label>
              <input
                type="text"
                value={userData.position}
                onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

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
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}