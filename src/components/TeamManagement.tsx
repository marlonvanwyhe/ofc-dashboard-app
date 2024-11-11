import React, { useState, useEffect } from 'react';
import { Plus, Grid, List, Users, Mail, Phone, Edit, Trash2, Eye } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import TeamCard from './team/TeamCard';
import TeamForm from './team/TeamForm';
import { Team, Coach, Player } from '../types';

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    coachId: '',
    players: [] as string[]
  });

  const fetchData = async () => {
    try {
      const teamsQuery = query(collection(db, 'teams'), orderBy('name'));
      const coachesQuery = query(collection(db, 'coaches'), orderBy('name'));
      const playersQuery = query(collection(db, 'players'), orderBy('name'));

      const [teamsSnapshot, coachesSnapshot, playersSnapshot] = await Promise.all([
        getDocs(teamsQuery),
        getDocs(coachesQuery),
        getDocs(playersQuery)
      ]);

      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
      
      const coachesData = coachesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coach[];
      
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];

      setTeams(teamsData);
      setCoaches(coachesData);
      setPlayers(playersData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const teamData = {
        name: formData.name,
        coachId: formData.coachId,
        players: formData.players,
        createdAt: new Date().toISOString()
      };

      if (editingTeam) {
        await updateDoc(doc(db, 'teams', editingTeam.id), {
          ...teamData,
          updatedAt: new Date().toISOString()
        });

        // Update player team assignments
        const updatePromises = players.map(player => {
          if (formData.players.includes(player.id)) {
            return updateDoc(doc(db, 'players', player.id), { teamId: editingTeam.id });
          } else if (player.teamId === editingTeam.id) {
            return updateDoc(doc(db, 'players', player.id), { teamId: null });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
        toast.success('Team updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'teams'), teamData);
        
        // Update player team assignments for new team
        const updatePromises = formData.players.map(playerId =>
          updateDoc(doc(db, 'players', playerId), { teamId: docRef.id })
        );

        await Promise.all(updatePromises);
        toast.success('Team created successfully!');
      }
      
      setFormData({ name: '', coachId: '', players: [] });
      setEditingTeam(null);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      coachId: team.coachId,
      players: team.players || []
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;

    try {
      // Update players to remove team assignment
      const updatePromises = players
        .filter(player => player.teamId === teamToDelete.id)
        .map(player => updateDoc(doc(db, 'players', player.id), { teamId: null }));

      await Promise.all(updatePromises);
      await deleteDoc(doc(db, 'teams', teamToDelete.id));
      
      toast.success('Team deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setShowDeleteModal(false);
      setTeamToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Team Management</h2>
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
            onClick={() => {
              setEditingTeam(null);
              setFormData({ name: '', coachId: '', players: [] });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
          >
            <Plus className="w-5 h-5" />
            Create Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            coach={coaches.find(c => c.id === team.coachId)}
            players={players}
            onEdit={handleEdit}
            onDelete={() => {
              setTeamToDelete(team);
              setShowDeleteModal(true);
            }}
          />
        ))}
      </div>

      {showModal && (
        <TeamForm
          formData={formData}
          coaches={coaches}
          players={players}
          loading={loading}
          isEditing={!!editingTeam}
          onSubmit={handleSubmit}
          onChange={setFormData}
          onClose={() => {
            setShowModal(false);
            setEditingTeam(null);
            setFormData({ name: '', coachId: '', players: [] });
          }}
        />
      )}

      {showDeleteModal && teamToDelete && (
        <DeleteConfirmationModal
          title="Delete Team"
          message={`Are you sure you want to delete ${teamToDelete.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setTeamToDelete(null);
          }}
        />
      )}
    </div>
  );
}