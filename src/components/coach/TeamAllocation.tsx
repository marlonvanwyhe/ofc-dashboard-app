import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Team } from '../../types';
import TeamAllocationModal from './TeamAllocationModal';

interface TeamAllocationProps {
  coachId: string;
}

export default function TeamAllocation({ coachId }: TeamAllocationProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchTeams = async () => {
    try {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('coachId', '==', coachId)
      );
      const snapshot = await getDocs(teamsQuery);
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [coachId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h4 className="font-medium text-gray-900 dark:text-white">Assigned Teams</h4>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-primary hover:text-secondary dark:text-blue-400 dark:hover:text-blue-300"
          >
            Manage Teams
          </button>
        </div>
        {teams.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {teams.map((team) => (
              <div key={team.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{team.name}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {team.players?.length || 0} Players
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No teams assigned
          </div>
        )}
      </div>

      {showModal && (
        <TeamAllocationModal
          coachId={coachId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchTeams();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}