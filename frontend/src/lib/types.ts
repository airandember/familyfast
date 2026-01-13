// ============================================
// Frontend Types - Mirror of backend types
// ============================================

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Family types
export type FamilyColor = 'orange' | 'blue' | 'purple' | 'green' | 'rose' | 'amber';

export const FAMILY_COLORS: { value: FamilyColor; label: string; class: string }[] = [
  { value: 'orange', label: 'Orange', class: 'from-orange-400 to-orange-600' },
  { value: 'blue', label: 'Blue', class: 'from-blue-400 to-blue-600' },
  { value: 'purple', label: 'Purple', class: 'from-purple-400 to-purple-600' },
  { value: 'green', label: 'Green', class: 'from-green-400 to-green-600' },
  { value: 'rose', label: 'Rose', class: 'from-rose-400 to-rose-600' },
  { value: 'amber', label: 'Amber', class: 'from-amber-400 to-amber-600' },
];

export interface Family {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  color: FamilyColor;
  emoji: string | null;
  inviteCode: string;
  createdAt: string;
  memberCount?: number;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familyId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user: User;
}

export interface FamilyWithMembers extends Family {
  members: FamilyMember[];
}

export interface CreateFamilyRequest {
  name: string;
  description?: string;
  color?: FamilyColor;
  emoji?: string;
}

export interface UpdateFamilyRequest {
  name?: string;
  description?: string;
  color?: FamilyColor;
  emoji?: string | null;
}

export interface JoinFamilyRequest {
  inviteCode: string;
}
