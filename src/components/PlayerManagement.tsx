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

  const fetchData = async () => {
    try {
      setLoading(true);
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
      toast.success('Player updated successfully');
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      await deleteDoc(doc(db, 'players', playerToDelete.id));
      setPlayers(players.filter(player => player.id !== playerToDelete.id));
      toast.success('Player deleted successfully');
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    } finally {
      setShowDeleteModal(false);
      setPlayerToDelete(null);
    }
  };

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.playerNumber && player.playerNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPlayers.map((player) => {
        const team = teams.find(t => t.id === player.teamId);
        
        return (
          <div key={player.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {player.imageUrl ? (
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">{player.name}</h3>
                  {player.playerNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">#{player.playerNumber}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/player-profile/${player.id}`)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setPlayerToDelete(player);
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
                <span>{player.email}</span>
              </div>
              {player.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{player.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{team?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Team
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredPlayers.map((player) => {
            const team = teams.find(t => t.id === player.teamId);
            
            return (
              <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {player.imageUrl ? (
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </div>
                      {player.playerNumber && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          #{player.playerNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {team?.name || 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{player.email}</div>
                  {player.phone && (
                    <div className="text-sm text-gray-500">{player.phone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/player-profile/${player.id}`)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setPlayerToDelete(player);
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
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Player Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
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
            Add Player
          </button>
        </div>
      </div>

      {loading ? (
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
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}

      {showCreateForm && (
        <CreateUserForm
          role="player"
          onSuccess={handleCreatePlayer}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {selectedPlayer && (
        <EditPlayerForm
          player={selectedPlayer}
          onSubmit={async (data) => {
            await handleUpdatePlayer(selectedPlayer.id, data);
            setSelectedPlayer(null);
          }}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {showDeleteModal && playerToDelete && (
        <DeleteConfirmationModal
          title="Delete Player"
          message={`Are you sure you want to delete ${playerToDelete.name}? This action cannot be undone.`}
          onConfirm={handleDeletePlayer}
          onCancel={() => {
            setShowDeleteModal(false);
            setPlayerToDelete(null);
          }}
        />
      )}
    </div>
  );
}