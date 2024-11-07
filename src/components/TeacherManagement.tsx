import React, { useState } from 'react';
import { User, UserPlus, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import toast from 'react-hot-toast';

export default function TeacherManagement() {
  const { coaches = [], addCoach } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [newCoach, setNewCoach] = useState({ name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCoach({
      name: newCoach.name,
      email: newCoach.email,
      role: 'coach',
    });
    setNewCoach({ name: '', email: '' });
    setShowModal(false);
    toast.success('Coach added successfully!');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Coach Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          Add Coach
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coaches.map((coach) => (
          <div
            key={coach.id}
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <User className="w-10 h-10 text-gray-500" />
              <div>
                <h3 className="font-semibold">{coach.name}</h3>
                <p className="text-sm text-gray-600">{coach.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Coach</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCoach.name}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCoach.email}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, email: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add Coach
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}