import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Shield, GraduationCap, Users, Mail, Phone, MapPin, Upload, Save } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.profileId) {
        setLoading(false);
        return;
      }
      
      try {
        // Use the correct collection name for coaches
        const collectionName = user.role === 'coach' ? 'coaches' : `${user.role}s`;
        const profileDoc = await getDoc(doc(db, collectionName, user.profileId));
        
        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
        } else {
          throw new Error('Profile not found');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user?.profileId) return;
    
    setSaving(true);
    try {
      // Use the correct collection name for coaches
      const collectionName = user.role === 'coach' ? 'coaches' : `${user.role}s`;
      const updatedData = {
        ...profileData,
        imageUrl: previewImage || profileData.imageUrl,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, collectionName, user.profileId), updatedData);
      setProfileData(updatedData);
      setIsEditing(false);
      setPreviewImage(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !profileData) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Profile Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load profile data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin':
        return <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400" />;
      case 'coach':
        return <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />;
      case 'player':
        return <GraduationCap className="w-12 h-12 text-green-600 dark:text-green-400" />;
      default:
        return null;
    }
  };

  const renderRoleSpecificFields = () => {
    switch (user.role) {
      case 'admin':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
              <input
                type="text"
                value={profileData.position || ''}
                onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        );

      case 'coach':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specialization</label>
              <input
                type="text"
                value={profileData.specialization || ''}
                onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experience (Years)</label>
              <input
                type="number"
                value={profileData.experience || ''}
                onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Player Number</label>
              <input
                type="text"
                value={profileData.playerNumber || ''}
                onChange={(e) => setProfileData({ ...profileData, playerNumber: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Name</label>
              <input
                type="text"
                value={profileData.guardianName || ''}
                onChange={(e) => setProfileData({ ...profileData, guardianName: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Contact</label>
              <input
                type="tel"
                value={profileData.guardianContact || ''}
                onChange={(e) => setProfileData({ ...profileData, guardianContact: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold dark:text-white">My Profile</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {(previewImage || profileData?.imageUrl) ? (
                    <img
                      src={previewImage || profileData.imageUrl}
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getRoleIcon()}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg cursor-pointer">
                    <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold dark:text-white">{profileData.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">{profileData.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profileData.phone || ''}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profileData.address || ''}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        disabled={!isEditing}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 dark:text-white">Role-Specific Information</h4>
                {renderRoleSpecificFields()}
              </div>

              {profileData.createdAt && (
                <div className="text-sm text-gray-500 dark:text-gray-400 pt-4">
                  <p>Member since: {new Date(profileData.createdAt).toLocaleDateString()}</p>
                  {profileData.updatedAt && (
                    <p>Last updated: {new Date(profileData.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}