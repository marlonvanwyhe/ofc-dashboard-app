import React from 'react';
import { Calendar, Users, Star, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Team, AttendanceRecord } from '../../types';

interface AttendanceListProps {
  groupedRecords: Record<string, Record<string, AttendanceRecord[]>>;
  teams: Team[];
  getTeamAttendance: (teamId: string, date: string) => { present: number; total: number };
}

export default function AttendanceList({
  groupedRecords,
  teams,
  getTeamAttendance
}: AttendanceListProps) {
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const calculateTeamStats = (teamId: string, records: AttendanceRecord[]) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return null;

    const totalPlayers = team.players.length;
    const presentPlayers = records.filter(r => r.present).length;
    const attendanceRate = totalPlayers > 0 ? (presentPlayers / totalPlayers) * 100 : 0;
    const averageRating = records.length > 0
      ? records.reduce((sum, r) => sum + (r.rating || 0), 0) / records.length
      : 0;

    return {
      attendanceRate,
      averageRating,
      presentPlayers,
      totalPlayers
    };
  };

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium">{format(new Date(date), 'PPPP')}</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedRecords[date]).map(([teamId, records]) => {
              const team = teams.find(t => t.id === teamId);
              if (!team) return null;

              const stats = calculateTeamStats(teamId, records);
              if (!stats) return null;

              return (
                <div key={teamId} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium text-lg">{team.name}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-800">Players Present</span>
                        </div>
                        <span className="text-blue-600 font-medium">
                          {stats.presentPlayers}/{stats.totalPlayers}
                        </span>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800">Attendance Rate</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          stats.attendanceRate >= 90
                            ? 'bg-green-200 text-green-800'
                            : stats.attendanceRate >= 75
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {stats.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-600" />
                          <span className="text-yellow-800">Average Rating</span>
                        </div>
                        <span className="text-yellow-600 font-medium">
                          {stats.averageRating.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    {records.filter(r => r.notes).length > 0 && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">Session Notes</h5>
                        <ul className="space-y-2">
                          {records.filter(r => r.notes).map((record, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>{record.notes}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}