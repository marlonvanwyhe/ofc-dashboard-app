import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, Star, Calendar } from 'lucide-react';
import { collection, getDocs, query, orderBy, where, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Team, Player, AttendanceRecord } from '../types';
import LoadingSpinner from './LoadingSpinner';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTeamCard } from './attendance/SortableTeamCard';
import { TeamCard } from './attendance/TeamCard';

interface TeamWithOrder {
  id: string;
  name: string;
  order: number;
  stats: {
    totalSessions: number;
    presentCount: number;
    attendanceRate: number;
    averageRating: number;
  };
}

export default function AttendanceManagement() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamWithOrder[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        let attendanceQuery;
        if (user?.role === 'player' && user.profileId) {
          attendanceQuery = query(
            collection(db, 'attendance'),
            where('playerId', '==', user.profileId),
            orderBy('date', 'desc')
          );
        } else {
          attendanceQuery = query(collection(db, 'attendance'), orderBy('date', 'desc'));
        }

        // Get teams with their stored order
        const teamsQuery = query(collection(db, 'teams'), orderBy('order', 'asc'));

        const [teamsSnapshot, playersSnapshot, attendanceSnapshot] = await Promise.all([
          getDocs(teamsQuery),
          getDocs(collection(db, 'players')),
          getDocs(attendanceQuery)
        ]);

        // Process attendance records first
        const attendanceData = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];

        // Map teams with their stored order, defaulting to index if order is not set
        const teamsData = teamsSnapshot.docs.map((doc, index) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            // Use the stored order if it exists, otherwise use the index
            order: typeof data.order === 'number' ? data.order : index,
            stats: calculateTeamStats(doc.id, attendanceData)
          };
        });

        // Sort teams by their order
        const sortedTeams = [...teamsData].sort((a, b) => a.order - b.order);

        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        setTeams(sortedTeams);
        setPlayers(playersData);
        setAttendanceRecords(attendanceData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calculateTeamStats = (teamId: string, records: AttendanceRecord[]) => {
    const teamRecords = records.filter(record => record.teamId === teamId);
    const totalSessions = teamRecords.length;
    const presentCount = teamRecords.filter(record => record.present).length;
    const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
    const averageRating = teamRecords.length > 0
      ? teamRecords.reduce((sum, record) => sum + (record.rating || 0), 0) / teamRecords.length
      : 0;

    return {
      totalSessions,
      presentCount,
      attendanceRate,
      averageRating
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const saveTeamOrder = async (updatedTeams: TeamWithOrder[]) => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Update each team's order in Firestore
      updatedTeams.forEach((team, index) => {
        const teamRef = doc(db, 'teams', team.id);
        batch.update(teamRef, { 
          order: index,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      toast.success('Team order saved');
    } catch (error) {
      console.error('Error saving team order:', error);
      toast.error('Failed to save team order');
      
      // Refresh the data to ensure we're showing the correct order
      const teamsQuery = query(collection(db, 'teams'), orderBy('order', 'asc'));
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        order: doc.data().order || 0,
        stats: calculateTeamStats(doc.id, attendanceRecords)
      }));

      setTeams(teamsData.sort((a, b) => a.order - b.order));
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTeams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }));

        // Save the new order to Firestore
        saveTeamOrder(newItems);

        return newItems;
      });
    }

    setActiveId(null);
  };

  const activeTeam = teams.find((team) => team.id === activeId);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark:text-white">
          {user?.role === 'player' ? 'My Attendance' : 'Attendance Management'}
        </h2>
        {user?.role === 'admin' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Drag and drop cards to rearrange teams
          </p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={teams} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <SortableTeamCard
                key={team.id}
                team={team}
                players={players}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && activeTeam ? (
            <div className="transform-gpu">
              <TeamCard
                team={activeTeam}
                players={players}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Saving changes...
        </div>
      )}
    </div>
  );
}