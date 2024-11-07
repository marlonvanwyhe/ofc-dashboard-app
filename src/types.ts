// Add or update the Team interface
export interface Team {
  id: string;
  name: string;
  coachId: string;
  players: string[];
  createdAt: string;
  updatedAt?: string;
}