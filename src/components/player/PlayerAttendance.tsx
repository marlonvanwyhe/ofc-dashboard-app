import React from 'react';
import { format } from 'date-fns';
import { Calendar, Star, AlertCircle } from 'lucide-react';
import { AttendanceRecord } from '../../types';

interface PlayerAttendanceProps {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}

export default function PlayerAttendance({ records, loading, error }: PlayerAttendanceProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = {
    present: records.filter(record => record.present).length,
    total: records.length || 1,
    averageRating: records.length ? 
      records.reduce((acc, record) => acc + (record.rating || 0), 0) / 
      (records.filter(record => record.rating).length || 1) : 0
  };

  const attendanceRate = (stats.present / stats.total) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-2xl font-bold">
            {attendanceRate.toFixed(1)}%
          </div>
          <div className="text-green-800">Attendance Rate</div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.present} of {stats.total} sessions
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 text-2xl font-bold">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="text-blue-800">Average Rating</div>
        </div>
      </div>

      <h4 className="font-semibold mb-4">Recent Attendance</h4>
      {records.length > 0 ? (
        <div className="space-y-3">
          {records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{format(new Date(record.date), 'PP')}</span>
              </div>
              <div className="flex items-center gap-3">
                {record.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{record.rating}/10</span>
                  </div>
                )}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.present
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {record.present ? 'Present' : 'Absent'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No attendance records found
        </div>
      )}
    </div>
  );
}