import React, { useState, useEffect } from 'react';
import { Grid, List, GraduationCap, Mail, Phone, MapPin, Search, Eye, Edit } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Player, Team } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';
import EditPlayerForm from '../player/EditPlayerForm';
import toast from 'react-hot-toast';

export default function CoachPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!user?.profileId) return;

    try {
      // First fetch teams assigned to coach
      const teamsQuery = query(
        collection(db, 'teams'),
        where('coachId', '==', user.profileId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
      setTeams(teamsData);

      // Get all player IDs from all teams
      const allPlayerIds = teamsData.reduce((acc: string[], team) => {
        return [...acc, ...(team.players || [])];
      }, []);

      // Remove duplicates
      const uniquePlayerIds = [...new Set(allPlayerIds)];

      if (uniquePlayerIds.length > 0) {
        // Fetch all players data
        const playersQuery = query(
          collection(db, 'players'),
          where('teamId', 'in', teamsData.map(team => team.id))
        );
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load players data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpdatePlayer = async (data: Partial<Player>) => {
    try {
      if (selectedPlayer) {
        await updateDoc(doc(db, 'players', selectedPlayer.id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
        toast.success('Player updated successfully');
        setSelectedPlayer(null);
        await fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.playerNumber && player.playerNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTeam = !selectedTeam || player.teamId === selectedTeam;
    
    return matchesSearch && matchesTeam;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Team
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
                  <div className="text-sm text-gray-900 dark:text-white">{player.email}</div>
                  {player.phone && (
                    <div className="text-sm text-gray-500">{player.phone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {team?.name || 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/player-profile/${player.id}`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="w-5 h-5" />
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
                  onClick={() => setSelectedPlayer(player)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate(`/player-profile/${player.id}`)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="w-5 h-5" />
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
                <MapPin className="w-4 h-4" />
                <span>{team?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">My Players</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-8">
          <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Players Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            There are no players assigned to your teams yet.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        renderListView()
      ) : (
        renderGridView()
      )}

      {selectedPlayer && (
        <EditPlayerForm
          player={selectedPlayer}
          onSubmit={handleUpdatePlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}