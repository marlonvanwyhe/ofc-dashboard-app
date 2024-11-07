import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Team, Player } from '../../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface AttendanceFormProps {
  teams: Team[];
  players: Player[];
  selectedDate: string;
  onClose: () => void;
}

export default function AttendanceForm({
  teams,
  players,
  selectedDate,
  onClose
}: AttendanceFormProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<{
    playerId: string;
    present: boolean;
    rating: number;
    notes: string;
  }[]>([]);

  // Initialize attendance records when team is selected
  useEffect(() => {
    if (selectedTeam) {
      const teamPlayers = players.filter(p => p.teamId === selectedTeam);
      setAttendance(teamPlayers.map(player => ({
        playerId: player.id,
        present: true,
        rating: 5,
        notes: ''
      })));
    }
  }, [selectedTeam, players]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }

    setLoading(true);
    try {
      // Create attendance records for each player
      const promises = attendance.map(record => 
        addDoc(collection(db, 'attendance'), {
          ...record,
          date,
          createdAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      toast.success('Attendance recorded successfully');
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">Record Attendance</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Choose a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>

          {selectedTeam && attendance.length > 0 && (
            <div className="space-y-4">
              {attendance.map((record, index) => {
                const player = players.find(p => p.id === record.playerId);
                return player ? (
                  <div
                    key={record.playerId}
                    className="p-4 border dark:border-gray-700 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium dark:text-white">{player.name}</span>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={record.present}
                          onChange={(e) => {
                            const newAttendance = [...attendance];
                            newAttendance[index].present = e.target.checked;
                            setAttendance(newAttendance);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Present</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Star className="w-4 h-4" />
                        Performance Rating (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={record.rating}
                        onChange={(e) => {
                          const newAttendance = [...attendance];
                          newAttendance[index].rating = Number(e.target.value);
                          setAttendance(newAttendance);
                        }}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={record.notes}
                        onChange={(e) => {
                          const newAttendance = [...attendance];
                          newAttendance[index].notes = e.target.value;
                          setAttendance(newAttendance);
                        }}
                        placeholder="Add notes about performance, behavior, etc."
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedTeam}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Submit Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
}