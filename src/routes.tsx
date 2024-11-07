import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import UnauthorizedPage from './components/auth/UnauthorizedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CoachDashboard from './components/coach/CoachDashboard';
import PlayerProfile from './components/PlayerProfile';
import LoginPage from './components/auth/LoginPage';

export default function AppRoutes() {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Admin Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      />

      {/* Coach Routes */}
      <Route
        path="/coach-dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['coach']}>
            <CoachDashboard />
          </ProtectedRoute>
        }
      />

      {/* Player Routes */}
      <Route
        path="/player-profile/:id"
        element={
          <ProtectedRoute allowedRoles={['player', 'admin', 'coach']}>
            <PlayerProfile />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}