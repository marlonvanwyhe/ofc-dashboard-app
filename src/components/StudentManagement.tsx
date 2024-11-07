import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserPlus, X, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import toast from 'react-hot-toast';

export default function StudentManagement() {
  const navigate = useNavigate();
  const { players = [], addPlayer } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    guardianName: '',
    guardianContact: '',
    profileImage: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlayer({
      ...newPlayer,
      role: 'player',
    });
    setNewPlayer({
      name: '',
      email: '',
      phone: '',
      address: '',
      guardianName: '',
      guardianContact: '',
      profileImage: '',
    });
    setShowModal(false);
    toast.success('Player added successfully!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPlayer({ ...newPlayer, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Player Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          Add Player
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div
            key={player.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {player.profileImage ? (
                  <img
                    src={player.profileImage}
                    alt={player.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-blue-100 p-3 rounded-full">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{player.name}</h3>
                  <button
                    onClick={() => navigate(`/players/${player.id}`)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
                <div className="space-y-2 mt-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {player.email}
                  </p>
                  {player.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {player.phone}
                    </p>
                  )}
                  {player.address && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {player.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Player</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 border rounded-lg"
                />
                {newPlayer.profileImage && (
                  <img
                    src={newPlayer.profileImage}
                    alt="Profile preview"
                    className="mt-2 w-20 h-20 rounded-full object-cover"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newPlayer.email}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, email: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPlayer.phone}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, phone: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newPlayer.address}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, address: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Guardian Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      value={newPlayer.guardianName}
                      onChange={(e) =>
                        setNewPlayer({ ...newPlayer, guardianName: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian Contact
                    </label>
                    <input
                      type="tel"
                      value={newPlayer.guardianContact}
                      onChange={(e) =>
                        setNewPlayer({
                          ...newPlayer,
                          guardianContact: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add Player
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}