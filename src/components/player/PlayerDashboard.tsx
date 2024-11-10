import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Calendar, BarChart } from 'lucide-react';
import { usePlayerData } from '../../hooks/usePlayerData';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { player, attendanceRecords, invoices, loading } = usePlayerData(user?.profileId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    attendance: {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(record => record.present).length,
      rate: attendanceRecords.length > 0
        ? (attendanceRecords.filter(record => record.present).length / attendanceRecords.length) * 100
        : 0
    },
    invoices: {
      total: invoices.length,
      outstanding: invoices.filter(inv => inv.status === 'outstanding').length,
      paid: invoices.filter(inv => inv.status === 'paid').length
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Welcome, {player?.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Profile</h3>
              <button
                onClick={() => navigate('/profile')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Attendance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.attendance.rate.toFixed(1)}% attendance rate
              </p>
              <button
                onClick={() => navigate('/attendance')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                View Attendance
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Invoices</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.invoices.outstanding} outstanding
              </p>
              <button
                onClick={() => navigate('/invoices')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                View Invoices
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Statistics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View your performance
              </p>
              <button
                onClick={() => navigate('/stats')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                View Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}