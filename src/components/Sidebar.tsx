import React from 'react';
import { Users, UserPlus, ClipboardList, LayoutDashboard, GraduationCap, FileText, Settings, LogOut, Shield, UserCircle, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SidebarProps {
  onCloseMobileMenu?: () => void;
}

export default function Sidebar({ onCloseMobileMenu }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { dashboardSettings } = useAppState();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { id: 'profile', icon: UserCircle, label: 'My Profile', path: '/profile' },
    ];

    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        ...baseItems,
        { id: 'coaches', icon: Users, label: 'Coaches', path: '/coaches' },
        { id: 'players', icon: GraduationCap, label: 'Players', path: '/players' },
        { id: 'teams', icon: UserPlus, label: 'Teams', path: '/teams' },
        { id: 'attendance', icon: ClipboardList, label: 'Attendance', path: '/attendance' },
        { id: 'invoices', icon: FileText, label: 'Invoices', path: '/invoices' },
        { id: 'admins', icon: Shield, label: 'Admins', path: '/admins' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
      ];
    } else if (user?.role === 'coach') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        ...baseItems,
        { id: 'players', icon: GraduationCap, label: 'Players', path: '/players' },
      ];
    } else if (user?.role === 'player') {
      return [
        ...baseItems,
        { id: 'attendance', icon: ClipboardList, label: 'My Attendance', path: '/attendance' },
        { id: 'invoices', icon: FileText, label: 'My Invoices', path: '/invoices' },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="bg-sidebar text-white w-64 min-h-screen p-4 flex flex-col relative">
      {/* Mobile close button */}
      {onCloseMobileMenu && (
        <button
          onClick={onCloseMobileMenu}
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="flex flex-col items-center gap-2 mb-8 mt-4">
        {dashboardSettings?.logoUrl ? (
          <img 
            src={dashboardSettings.logoUrl} 
            alt={dashboardSettings.name}
            className="w-24 h-24 object-contain"
          />
        ) : (
          <Users className="w-12 h-12" />
        )}
        <h1 className="text-xl font-bold text-center">{dashboardSettings?.name || 'Sports Academy'}</h1>
        {user && (
          <div className="text-sm text-gray-300 text-center">
            <div>{user.name}</div>
            <div className="text-xs text-gray-400 capitalize">({user.role})</div>
          </div>
        )}
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={onCloseMobileMenu}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentPath === item.path
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:bg-secondary'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg mt-4 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}