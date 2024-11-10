import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlayerData } from '../../hooks/usePlayerData';
import { Star, Calendar, TrendingUp, MessageCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { format } from 'date-fns';

export default function PlayerStats() {
  const { user } = useAuth();
  const { attendanceRecords, loading } = usePlayerData(user?.profileId);

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = {
    attendance: {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(record => record.present).length,
      rate: attendanceRecords.length > 0
        ? (attendanceRecords.filter(record => record.present).length / attendanceRecords.length) * 100
        : 0
    },
    ratings: attendanceRecords
      .filter(record => record.rating)
      .map(record => ({
        date: record.date,
        rating: record.rating,
        notes: record.notes
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };

  const averageRating = stats.ratings.length > 0
    ? stats.ratings.reduce((sum, record) => sum + (record.rating || 0), 0) / stats.ratings.length
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 dark:text-white">Performance Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Attendance Rate</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.attendance.rate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.attendance.present} of {stats.attendance.total} sessions
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Average Rating</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {averageRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                From {stats.ratings.length} ratings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Latest Rating</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.ratings[0]?.rating.toFixed(1) || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.ratings[0] ? format(new Date(stats.ratings[0].date), 'MMM d, yyyy') : 'No ratings yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-6 h-6 text-gray-400" />
          <h2 className="text-xl font-semibold dark:text-white">Performance History</h2>
        </div>

        <div className="space-y-4">
          {stats.ratings.map((record, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(record.date), 'MMMM d, yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-semibold dark:text-white">{record.rating.toFixed(1)}</span>
                </div>
              </div>
              {record.notes && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">{record.notes}</p>
              )}
            </div>
          ))}
          {stats.ratings.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No performance ratings available yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}