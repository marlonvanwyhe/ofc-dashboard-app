import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

interface TeamWithStats extends Team {
  stats: {
    totalSessions: number;
    presentCount: number;
    attendanceRate: number;
    averageRating: number;
  };
}

export default function AttendanceManagement() {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
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
        // Fetch teams, players, and attendance records in parallel
        const [teamsSnapshot, playersSnapshot, attendanceSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'teams'), orderBy('order', 'asc'))),
          getDocs(collection(db, 'players')),
          getDocs(query(collection(db, 'attendance'), orderBy('date', 'desc')))
        ]);

        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];

        // Process teams with stats
        const teamsData = teamsSnapshot.docs.map((doc, index) => {
          const teamData = doc.data();
          const teamPlayers = playersData.filter(p => p.teamId === doc.id);
          const teamAttendance = attendanceRecords.filter(record => 
            teamPlayers.some(p => p.id === record.playerId)
          );

          // Calculate team stats
          const totalSessions = teamAttendance.length;
          const presentCount = teamAttendance.filter(record => record.present).length;
          const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

          // Calculate average rating only from records with ratings
          const validRatings = teamAttendance.filter(record => record.rating && record.rating > 0);
          const averageRating = validRatings.length > 0
            ? validRatings.reduce((sum, record) => sum + (record.rating || 0), 0) / validRatings.length
            : 0;

          return {
            id: doc.id,
            ...teamData,
            order: typeof teamData.order === 'number' ? teamData.order : index,
            stats: {
              totalSessions,
              presentCount,
              attendanceRate,
              averageRating
            }
          } as TeamWithStats;
        });

        setTeams(teamsData.sort((a, b) => a.order - b.order));
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTeams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const activeTeam = teams.find((team) => team.id === activeId);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold dark:text-white mb-6">Attendance Overview</h2>

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