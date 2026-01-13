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

// ============================================
// FEEDS BRAID Types
// ============================================

export type ReactionType = 'heart' | 'thumbsup' | 'laugh' | 'wow' | 'sad' | 'celebrate';

export interface Post {
  id: string;
  familyId: string;
  authorId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: User;
  commentCount: number;
  reactions: ReactionSummary[];
  userReaction?: ReactionType | null;
}

export interface ReactionSummary {
  emoji: ReactionType;
  count: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: User;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface ToggleReactionRequest {
  emoji: ReactionType;
}

// ============================================
// MILESTONES BRAID Types
// ============================================

export type MilestoneType = 'birthday' | 'anniversary' | 'achievement' | 'custom';

export interface Milestone {
  id: string;
  familyId: string;
  createdById: string;
  title: string;
  description: string | null;
  date: string;
  type: MilestoneType;
  recurring: boolean;
  emoji: string | null;
  personName: string | null;
  createdAt: string;
  createdBy: User;
  daysUntil?: number; // Calculated field for upcoming milestones
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  date: string;
  type?: MilestoneType;
  recurring?: boolean;
  emoji?: string;
  personName?: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  date?: string;
  type?: MilestoneType;
  recurring?: boolean;
  emoji?: string | null;
  personName?: string | null;
}

// ============================================
// CHALLENGES BRAID Types
// ============================================

export type ChallengeType = 'fasting' | 'exercise' | 'custom';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type FastingStatus = 'fasting' | 'feeding' | 'broke_fast';

export interface FastingSettings {
  feedingWindowStart: string; // "12:00" 24h format
  feedingWindowEnd: string;   // "20:00" 24h format
  fastingHours: number;       // e.g., 16 for 16:8
}

export interface Challenge {
  id: string;
  familyId: string;
  createdById: string;
  name: string;
  description: string | null;
  emoji: string | null;
  type: ChallengeType;
  startDate: string;
  endDate: string;
  settings: FastingSettings | null;
  status: ChallengeStatus;
  createdAt: string;
  createdBy: User;
  participantCount: number;
  isParticipating?: boolean;
  myProgress?: ChallengeProgress;
}

export interface ChallengeProgress {
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  completionRate: number;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: string;
  status: string;
  user: User;
  progress: ChallengeProgress;
}

export interface ChallengeLog {
  id: string;
  challengeId: string;
  userId: string;
  date: string;
  completed: boolean;
  notes: string | null;
  fastingStatus: FastingStatus | null;
  createdAt: string;
  foodLogs?: FoodLog[];
}

export interface CreateChallengeRequest {
  name: string;
  description?: string;
  emoji?: string;
  type?: ChallengeType;
  startDate: string;
  endDate: string;
  settings?: FastingSettings;
}

export interface CreateChallengeLogRequest {
  date: string;
  completed?: boolean;
  notes?: string;
  fastingStatus?: FastingStatus;
}

// ============================================
// HEALTH BRAID Types
// ============================================

export interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  unit: 'lbs' | 'kg';
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface FoodLog {
  id: string;
  userId: string;
  challengeLogId: string | null;
  description: string;
  imageUrl: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  loggedAt: string;
  createdAt: string;
}

export interface CreateWeightLogRequest {
  weight: number;
  unit?: 'lbs' | 'kg';
  date: string;
  notes?: string;
}

export interface CreateFoodLogRequest {
  challengeLogId?: string;
  description: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface WeightTrend {
  date: string;
  weight: number;
  change?: number;
}

// ============================================
// API Response types
// ============================================

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
