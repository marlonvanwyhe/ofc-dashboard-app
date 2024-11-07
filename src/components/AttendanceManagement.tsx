import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, Star, Calendar } from 'lucide-react';
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
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

        const [teamsSnapshot, playersSnapshot, attendanceSnapshot] = await Promise.all([
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'players')),
          getDocs(attendanceQuery)
        ]);

        const teamsData = teamsSnapshot.docs.map((doc, index) => ({
          id: doc.id,
          name: doc.data().name,
          order: doc.data().order || index,
          stats: calculateTeamStats(doc.id, attendanceSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          }) as AttendanceRecord))
        })).sort((a, b) => a.order - b.order);

        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        const attendanceData = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];

        setTeams(teamsData);
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

        // Update positions in Firestore
        Promise.all(
          newItems.map((team) =>
            updateDoc(doc(db, 'teams', team.id), {
              order: team.order,
            })
          )
        ).catch((error) => {
          console.error('Error updating team positions:', error);
          toast.error('Failed to save new positions');
        });

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
    </div>
  );
}