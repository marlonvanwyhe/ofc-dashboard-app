import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Check, X, FileText, Save } from 'lucide-react';
import { usePlayerData } from '../../hooks/usePlayerData';
import PlayerInfo from './PlayerInfo';
import PlayerAttendance from './PlayerAttendance';
import PlayerInvoices from './PlayerInvoices';
import LoadingSpinner from '../LoadingSpinner';
import RecordAttendanceModal from '../attendance/RecordAttendanceModal';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import EditPlayerForm from './EditPlayerForm';
import { Player } from '../../types';

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [recordingAttendance, setRecordingAttendance] = useState(false);

  const {
    player,
    attendanceRecords,
    invoices,
    loading,
    error,
    refreshData
  } = usePlayerData(id);

  if (!id || id === 'undefined') {
    if (user?.role === 'admin') {
      navigate('/players');
      return null;
    } else if (user?.role === 'coach') {
      navigate('/');
      return null;
    } else {
      navigate('/login');
      return null;
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !player) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error || 'Player Not Found'}
          </h2>
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/players' : '/')}
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {user?.role === 'admin' ? 'Players' : 'Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const handleUpdatePlayer = async (data: Partial<Player>) => {
    try {
      await updateDoc(doc(db, 'players', player.id), {
        ...data,
        updatedAt: new Date().toISOString()
      });

      await refreshData();
      setIsEditing(false);
      toast.success('Player profile updated successfully');
    } catch (error: any) {
      console.error('Error updating player:', error);
      toast.error(error.message || 'Failed to update player');
    }
  };

  const handleRecordAttendance = async (data: {
    date: string;
    present: boolean;
    rating: number;
    notes: string;
  }) => {
    if (!id) return;
    setRecordingAttendance(true);

    try {
      await addDoc(collection(db, 'attendance'), {
        playerId: id,
        date: data.date,
        present: data.present,
        rating: data.rating,
        notes: data.notes,
        createdAt: new Date().toISOString()
      });

      toast.success('Attendance recorded successfully');
      setShowAttendanceModal(false);
      refreshData();
    } catch (error: any) {
      console.error('Error recording attendance:', error);
      toast.error(error.message || 'Failed to record attendance');
    } finally {
      setRecordingAttendance(false);
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/';
      case 'coach':
        return '/coach-dashboard';
      case 'player':
        return `/player-profile/${user.profileId}`;
      default:
        return '/';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => navigate(getDashboardPath())}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'admin' || user?.role === 'coach') && (
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Record Attendance
            </button>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
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
                onClick={() => handleUpdatePlayer(player)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PlayerInfo
            player={player}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onCancelEdit={() => setIsEditing(false)}
            onUpdatePlayer={handleUpdatePlayer}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <PlayerAttendance
            records={attendanceRecords}
            loading={loading}
            error={null}
          />
          {/* Only show invoices for admin and player roles */}
          {user?.role !== 'coach' && (
            <PlayerInvoices
              invoices={invoices}
              loading={loading}
              error={null}
            />
          )}
        </div>
      </div>

      {showAttendanceModal && (
        <RecordAttendanceModal
          onClose={() => setShowAttendanceModal(false)}
          onSubmit={handleRecordAttendance}
          loading={recordingAttendance}
        />
      )}

      {isEditing && (
        <EditPlayerForm
          player={player}
          onSubmit={handleUpdatePlayer}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}