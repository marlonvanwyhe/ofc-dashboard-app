import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TeamCard } from './TeamCard';
import { Player } from '../../types';

interface SortableTeamCardProps {
  team: {
    id: string;
    name: string;
    stats: {
      totalSessions: number;
      presentCount: number;
      attendanceRate: number;
      averageRating: number;
    };
  };
  players: Player[];
}

export function SortableTeamCard({ team, players }: SortableTeamCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? 'z-50' : ''}`}
    >
      <TeamCard team={team} players={players} />
    </div>
  );
}