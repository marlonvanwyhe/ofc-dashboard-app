import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Phone, MapPin, Edit, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Coach, Team } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import TeamAllocation from './TeamAllocation';
import EditCoachForm from './EditCoachForm';
import toast from 'react-hot-toast';

export default function CoachProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (!id) return;

      try {
        const coachDoc = await getDoc(doc(db, 'coaches', id));
        if (!coachDoc.exists()) {
          toast.error('Coach not found');
          return;
        }

        const coachData = {
          id: coachDoc.id,
          ...coachDoc.data()
        } as Coach;

        setCoach(coachData);

        // Fetch teams assigned to this coach
        const teamsQuery = query(collection(db, 'teams'), where('coachId', '==', id));
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];

        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching coach data:', error);
        toast.error('Failed to load coach data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!coach) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Coach Not Found</h2>
          <button
            onClick={() => navigate('/coaches')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coaches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/coaches')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coaches
          </button>
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/' : '/coach-dashboard')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4 mb-6">
              {coach.imageUrl ? (
                <img
                  src={coach.imageUrl}
                  alt={coach.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold dark:text-white">{coach.name}</h2>
                {coach.specialization && (
                  <p className="text-gray-600 dark:text-gray-400">{coach.specialization}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="dark:text-gray-300">{coach.email}</span>
              </div>
              
              {coach.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="dark:text-gray-300">{coach.phone}</span>
                </div>
              )}
              
              {coach.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="dark:text-gray-300">{coach.address}</span>
                </div>
              )}
            </div>

            {coach.experience && (
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="text-lg font-semibold dark:text-white mb-2">Experience</h3>
                <p className="text-gray-600 dark:text-gray-400">{coach.experience} years</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <TeamAllocation coachId={coach.id} />
        </div>
      </div>

      {isEditing && (
        <EditCoachForm
          coach={coach}
          onSubmit={async (data) => {
            await handleUpdateCoach(data);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}