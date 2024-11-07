export type UserRole = 'admin' | 'coach' | 'player';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  profileId?: string; // References the actual player/coach ID
}

export interface LoginCredentials {
  email: string;
  password: string;
}