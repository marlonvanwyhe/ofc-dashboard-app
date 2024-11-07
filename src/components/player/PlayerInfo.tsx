import React, { useState, useEffect } from 'react';
import { GraduationCap, Mail, Phone, MapPin, Users, Edit } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Player, Team } from '../../types';
import EditPlayerForm from './EditPlayerForm';

interface PlayerInfoProps {
  player: Player;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdatePlayer: (data: Partial<Player>) => Promise<void>;
}

export default function PlayerInfo({ 
  player,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onUpdatePlayer
}: PlayerInfoProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!player.teamId) {
        setTeam(null);
        setLoading(false);
        return;
      }

      try {
        const teamDoc = await getDoc(doc(db, 'teams', player.teamId));
        if (teamDoc.exists()) {
          setTeam({
            id: teamDoc.id,
            ...teamDoc.data()
          } as Team);
        } else {
          setTeam(null);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [player.teamId]);

  const handleEdit = () => {
    setShowEditForm(true);
    onStartEdit();
  };

  const handleClose = () => {
    setShowEditForm(false);
    onCancelEdit();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold dark:text-white">{player.name}</h2>
              {player.playerNumber && (
                <p className="text-gray-600 dark:text-gray-400">#{player.playerNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="dark:text-gray-300">{player.email}</span>
          </div>
          
          {player.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="dark:text-gray-300">{player.phone}</span>
            </div>
          )}
          
          {player.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="dark:text-gray-300">{player.address}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <span className="dark:text-gray-300">Team:</span>
              {loading ? (
                <span className="text-gray-500 dark:text-gray-400">Loading...</span>
              ) : team ? (
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                  {team.name}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No team assigned</span>
              )}
            </div>
          </div>
        </div>

        {(player.guardianName || player.guardianContact) && (
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Guardian Information</h3>
            <div className="space-y-2">
              {player.guardianName && (
                <p className="text-gray-600 dark:text-gray-400">{player.guardianName}</p>
              )}
              {player.guardianContact && (
                <p className="text-gray-600 dark:text-gray-400">{player.guardianContact}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditForm && (
        <EditPlayerForm
          player={player}
          onSubmit={onUpdatePlayer}
          onClose={handleClose}
        />
      )}
    </>
  );
}