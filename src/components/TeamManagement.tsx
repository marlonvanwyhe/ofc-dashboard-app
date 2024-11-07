import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    coachId: '',
    players: [] as string[],
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
        await updateDoc(doc(db, 'teams', editingTeam.id), teamData);
        toast.success('Team updated successfully!');
      } else {
        await addDoc(collection(db, 'teams'), teamData);
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
      players: team.players,
    });
    setShowModal(true);
  };

  const handleDelete = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    try {
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
        >
          <Plus className="w-5 h-5" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            coach={coaches.find(c => c.id === team.coachId)}
            players={players}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setTeamToDelete(null);
          }}
        />
      )}
    </div>
  );
}