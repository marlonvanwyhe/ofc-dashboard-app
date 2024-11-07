import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { format } from 'date-fns';

interface RecordAttendanceModalProps {
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    present: boolean;
    rating: number;
    notes: string;
  }) => void;
  loading: boolean;
}

export default function RecordAttendanceModal({
  onClose,
  onSubmit,
  loading
}: RecordAttendanceModalProps) {
  const [attendanceData, setAttendanceData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    present: true,
    rating: 5,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(attendanceData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Record Attendance</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={attendanceData.date}
              onChange={(e) =>
                setAttendanceData({ ...attendanceData, date: e.target.value })
              }
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={attendanceData.present}
                onChange={(e) =>
                  setAttendanceData({ ...attendanceData, present: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Present</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Star className="w-4 h-4" />
              Performance Rating (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={attendanceData.rating}
              onChange={(e) =>
                setAttendanceData({
                  ...attendanceData,
                  rating: parseInt(e.target.value) || 5
                })
              }
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={attendanceData.notes}
              onChange={(e) =>
                setAttendanceData({ ...attendanceData, notes: e.target.value })
              }
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Add any notes about performance, behavior, etc."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Record Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
}