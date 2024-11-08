import React, { useState, useEffect } from 'react';
import { Plus, Grid, List, GraduationCap, Mail, Phone, MapPin, Users, Edit, Trash2, Eye } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Team, Player } from '../types';
import CreateUserForm from './auth/CreateUserForm';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditPlayerForm from './player/EditPlayerForm';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useStats } from '../hooks/useStats';

export default function PlayerManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const { refreshStats } = useStats(players);

  const fetchData = async () => {
    try {
      const [playersSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'players'), orderBy('name'))),
        getDocs(query(collection(db, 'teams'), orderBy('name')))
      ]);

      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];

      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];

      setPlayers(playersData);
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

  const handleCreatePlayer = async (userId: string, userData: any) => {
    try {
      const newPlayer: Player = {
        id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        playerNumber: userData.playerNumber || '',
        imageUrl: userData.imageUrl || '',
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };

      setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
      setShowCreateForm(false);
      toast.success('Player created successfully');
      await fetchData();
      await refreshStats();
    } catch (error) {
      console.error('Error handling new player:', error);
      toast.error('Error adding new player to the list');
    }
  };

  const handleUpdatePlayer = async (playerId: string, updatedData: Partial<Player>) => {
    try {
      await updateDoc(doc(db, 'players', playerId), {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
      await fetchData();
      await refreshStats();
      toast.success('Player updated successfully');
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };

  const handleDelete = async () => {
    if (!playerToDelete) return;

    try {
      await deleteDoc(doc(db, 'players', playerToDelete.id));
      setPlayers(players.filter(player => player.id !== playerToDelete.id));
      await refreshStats();
      toast.success('Player deleted successfully');
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    } finally {
      setShowDeleteModal(false);
      setPlayerToDelete(null);
    }
  };

  // ... rest of the component remains the same ...
}