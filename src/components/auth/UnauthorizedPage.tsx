import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRedirectPath = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/';
      case 'coach':
        return '/coach-dashboard';
      case 'player':
        return `/player-profile/${user.profileId}`;
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-4">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => navigate(getRedirectPath())}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}