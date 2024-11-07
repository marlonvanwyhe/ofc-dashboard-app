export type UserRole = 'admin' | 'coach' | 'player';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  profileId?: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  phone?: string;
  playerNumber?: string;
  teamId?: string;
  guardianName?: string;
  guardianContact?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  coachId: string;
  players: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  playerId: string;
  date: string;
  present: boolean;
  rating?: number;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  playerId: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'paid' | 'outstanding';
  items: InvoiceLineItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  amount: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  sidebar: string;
}

export interface DashboardSettings {
  name: string;
  logoUrl: string;
  theme: ThemeColors;
  darkMode: boolean;
}