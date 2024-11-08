import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Mail, Phone, Star, Calendar, ArrowLeft } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Coach, Team, AttendanceRecord } from '../../types';
import EditCoachForm from './EditCoachForm';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

export default function CoachProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalSessions: 0,
    averageAttendance: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchCoachData = async () => {
    if (!id) {
      setError('Invalid coach ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch coach data
      const coachDoc = await getDoc(doc(db, 'coaches', id));
      if (!coachDoc.exists()) {
        setError('Coach not found');
        setLoading(false);
        return;
      }

      const coachData = { id: coachDoc.id, ...coachDoc.data() } as Coach;
      setCoach(coachData);

      // Fetch teams assigned to coach - simplified query without ordering
      const teamsQuery = query(
        collection(db, 'teams'),
        where('coachId', '==', id)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];

      // Sort teams in memory instead of in the query
      const sortedTeams = teamsData.sort((a, b) => a.name.localeCompare(b.name));
      setTeams(sortedTeams);

      // Calculate attendance stats if there are teams
      if (sortedTeams.length > 0) {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('teamId', 'in', sortedTeams.map(team => team.id))
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];

        if (attendanceRecords.length > 0) {
          const totalSessions = attendanceRecords.length;
          const presentCount = attendanceRecords.filter(record => record.present).length;
          const averageAttendance = (presentCount / totalSessions) * 100;
          const averageRating = attendanceRecords.reduce((sum, record) => sum + (record.rating || 0), 0) / totalSessions;

          setAttendanceStats({
            totalSessions,
            averageAttendance,
            averageRating
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching coach data:', error);
      setError(error.message || 'Failed to load coach data');
      toast.error('Failed to load coach data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, [id]);

  const handleUpdateCoach = async (updatedData: Partial<Coach>) => {
    if (!id || !coach) return;

    try {
      const coachRef = doc(db, 'coaches', id);
      const updatedCoach = {
        ...coach,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(coachRef, updatedCoach);
      setCoach(updatedCoach);
      setIsEditing(false);
      toast.success('Coach profile updated successfully');
      
      // Refresh data to ensure consistency
      await fetchCoachData();
    } catch (error: any) {
      console.error('Error updating coach:', error);
      toast.error(error.message || 'Failed to update coach profile');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !coach) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{error || 'Coach Not Found'}</h2>
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
        <button
          onClick={() => navigate('/coaches')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Coaches
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
                {coach.imageUrl ? (
                  <img
                    src={coach.imageUrl}
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold dark:text-white">{coach.name}</h2>
              {coach.specialization && (
                <p className="text-gray-600 dark:text-gray-400">{coach.specialization}</p>
              )}
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
              {coach.experience && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="dark:text-gray-300">{coach.experience} years experience</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">Teams</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {teams.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">Attendance</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {attendanceStats.averageAttendance.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                  <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">Rating</h3>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {attendanceStats.averageRating.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Assigned Teams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(team => (
                <div
                  key={team.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <h4 className="font-medium dark:text-white">{team.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {team.players?.length || 0} Players
                  </p>
                </div>
              ))}
              {teams.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">
                  No teams assigned yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing && coach && (
        <EditCoachForm
          coach={coach}
          onSubmit={handleUpdateCoach}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}