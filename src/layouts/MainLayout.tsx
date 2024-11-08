import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import CoachDashboard from '../components/coach/CoachDashboard';
import CoachManagement from '../components/CoachManagement';
import PlayerManagement from '../components/PlayerManagement';
import TeamManagement from '../components/TeamManagement';
import AttendanceManagement from '../components/AttendanceManagement';
import PlayerProfile from '../components/PlayerProfile';
import CoachProfile from '../components/coach/CoachProfile';
import InvoiceManagement from '../components/InvoiceManagement';
import DashboardSettings from '../components/DashboardSettings';
import AdminManagement from '../components/AdminManagement';
import UserProfile from '../components/profile/UserProfile';
import ErrorBoundary from '../components/ErrorBoundary';
import CoachPlayers from '../components/coach/CoachPlayers';
import { Menu } from 'lucide-react';

export default function MainLayout() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Define routes based on user role
  const getRoutes = () => {
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/coaches" element={<CoachManagement />} />
            <Route path="/coach-profile/:id" element={<CoachProfile />} />
            <Route path="/players" element={<PlayerManagement />} />
            <Route path="/player-profile/:id" element={<PlayerProfile />} />
            <Route path="/teams" element={<TeamManagement />} />
            <Route path="/attendance" element={<AttendanceManagement />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            <Route path="/settings" element={<DashboardSettings />} />
            <Route path="/admins" element={<AdminManagement />} />
          </>
        );

      case 'coach':
        return (
          <>
            <Route path="/" element={<CoachDashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/players" element={<CoachPlayers />} />
            <Route path="/player-profile/:id" element={<PlayerProfile />} />
          </>
        );

      case 'player':
        return (
          <>
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/player-profile/:id" element={<PlayerProfile />} />
            <Route path="/attendance" element={<AttendanceManagement />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            <Route path="*" element={<Navigate to={`/player-profile/${user.profileId}`} replace />} />
          </>
        );

      default:
        return <Route path="*" element={<Navigate to="/login" replace />} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md"
      >
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Sidebar with responsive behavior */}
      <div
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
          <ErrorBoundary>
            <Routes>{getRoutes()}</Routes>
          </ErrorBoundary>
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}