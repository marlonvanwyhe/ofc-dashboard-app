import React, { useState, useEffect } from 'react';
import { Plus, Grid, List, Users, Mail, Phone, Edit, Trash2, Eye } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Team, Coach } from '../types';
import CreateUserForm from './auth/CreateUserForm';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditCoachForm from './coach/EditCoachForm';
import { migrateCoachesCollection } from '../lib/migrateCoaches';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CoachManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchData = async () => {
    try {
      setLoading(true);

      // First, attempt migration if needed
      await migrateCoachesCollection();

      // Fetch all coaches from the correct "coaches" collection
      const coachesQuery = query(collection(db, 'coaches'), orderBy('name'));
      const coachesSnapshot = await getDocs(coachesQuery);
      const coachesData = coachesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coach[];
      setCoaches(coachesData);

      // Fetch teams
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCoach = async (userId: string, userData: any) => {
    try {
      setCoaches(prevCoaches => [...prevCoaches, {
        id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        specialization: userData.specialization || '',
        experience: userData.experience || '',
        imageUrl: userData.imageUrl || '',
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }]);
      setShowCreateForm(false);
      toast.success('Coach created successfully');
      await fetchData(); // Refresh data to ensure consistency
    } catch (error) {
      console.error('Error handling new coach:', error);
      toast.error('Error adding new coach');
    }
  };

  const handleDeleteCoach = async () => {
    if (!coachToDelete) return;

    try {
      // Remove coach from teams first
      const coachTeams = teams.filter(team => team.coachId === coachToDelete.id);
      const teamUpdates = coachTeams.map(team => 
        updateDoc(doc(db, 'teams', team.id), { coachId: null })
      );
      await Promise.all(teamUpdates);

      // Delete coach document
      await deleteDoc(doc(db, 'coaches', coachToDelete.id));
      
      setCoaches(coaches.filter(coach => coach.id !== coachToDelete.id));
      toast.success('Coach deleted successfully');
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast.error('Failed to delete coach');
    } finally {
      setShowDeleteModal(false);
      setCoachToDelete(null);
    }
  };

  const getCoachTeams = (coachId: string) => {
    return teams.filter(team => team.coachId === coachId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Coach Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
          >
            <Plus className="w-5 h-5" />
            Add Coach
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => {
            const assignedTeams = getCoachTeams(coach.id);
            
            return (
              <div key={coach.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {coach.imageUrl ? (
                      <img
                        src={coach.imageUrl}
                        alt={coach.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg dark:text-white">{coach.name}</h3>
                      {coach.specialization && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {coach.specialization}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/coach-profile/${coach.id}`)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedCoach(coach)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setCoachToDelete(coach);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{coach.email}</span>
                  </div>
                  {coach.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{coach.phone}</span>
                    </div>
                  )}
                </div>

                {assignedTeams.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned Teams
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assignedTeams.map(team => (
                        <span
                          key={team.id}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-sm"
                        >
                          {team.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teams
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {coaches.map((coach) => {
                const assignedTeams = getCoachTeams(coach.id);
                
                return (
                  <tr key={coach.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {coach.imageUrl ? (
                            <img
                              src={coach.imageUrl}
                              alt={coach.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {coach.name}
                          </div>
                          {coach.specialization && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {coach.specialization}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{coach.email}</div>
                      {coach.phone && (
                        <div className="text-sm text-gray-500">{coach.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {assignedTeams.map(team => (
                          <span
                            key={team.id}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-sm"
                          >
                            {team.name}
                          </span>
                        ))}
                        {assignedTeams.length === 0 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            No teams assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/coach-profile/${coach.id}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedCoach(coach)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setCoachToDelete(coach);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateForm && (
        <CreateUserForm
          role="coach"
          onSuccess={handleCreateCoach}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {selectedCoach && (
        <EditCoachForm
          coach={selectedCoach}
          onSubmit={async () => {
            await fetchData();
            setSelectedCoach(null);
          }}
          onClose={() => setSelectedCoach(null)}
        />
      )}

      {showDeleteModal && coachToDelete && (
        <DeleteConfirmationModal
          title="Delete Coach"
          message={`Are you sure you want to delete ${coachToDelete.name}? This action cannot be undone.`}
          onConfirm={handleDeleteCoach}
          onCancel={() => {
            setShowDeleteModal(false);
            setCoachToDelete(null);
          }}
        />
      )}
    </div>
  );
}