// ============================================
// Core Types - Shared across frontend & backend
// ============================================

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserProfile extends User {
  familyCount: number;
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

export interface InviteMemberRequest {
  email?: string;
}

export interface JoinFamilyRequest {
  inviteCode: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
