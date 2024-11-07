import React from 'react';
import { Users, Star } from 'lucide-react';
import { Team, AttendanceRecord } from '../../types';

interface TeamAttendanceStatsProps {
  team: Team;
  attendanceRecords: AttendanceRecord[];
}

export default function TeamAttendanceStats({ team, attendanceRecords }: TeamAttendanceStatsProps) {
  const teamRecords = attendanceRecords.filter(record => 
    team.players.includes(record.playerId)
  );

  const stats = {
    totalSessions: teamRecords.length,
    presentCount: teamRecords.filter(record => record.present).length,
    averageRating: teamRecords.length ? 
      teamRecords.reduce((sum, record) => sum + (record.rating || 0), 0) / 
      teamRecords.filter(record => record.rating).length : 0
  };

  const attendanceRate = stats.totalSessions > 0 
    ? (stats.presentCount / stats.totalSessions) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{team.name}</h3>
          <p className="text-sm text-gray-600">{team.players.length} Players</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-2xl font-bold">
            {attendanceRate.toFixed(1)}%
          </div>
          <div className="text-green-800">Attendance Rate</div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.presentCount} of {stats.totalSessions} sessions
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            <div className="text-blue-600 text-2xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
          </div>
          <div className="text-blue-800">Average Rating</div>
        </div>
      </div>
    </div>
  );
}