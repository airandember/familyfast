import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Family validation schemas
const familyColors = ['orange', 'blue', 'purple', 'green', 'rose', 'amber'] as const;

export const createFamilySchema = z.object({
  name: z.string().min(2, 'Family name must be at least 2 characters').max(50),
  description: z.string().max(500).optional(),
  color: z.enum(familyColors).optional(),
  emoji: z.string().max(50).optional(), // Emojis like 👨‍👩‍👧‍👦 use multiple code points
});

export const updateFamilySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  color: z.enum(familyColors).optional(),
  emoji: z.string().max(50).nullable().optional(), // Emojis like 👨‍👩‍👧‍👦 use multiple code points
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

export const joinFamilySchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

// ============================================
// Feeds validation schemas
// ============================================

const reactionEmojis = ['❤️', '👍', '😂', '😮', '😢', '🎉'] as const;

export const createPostSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(2000),
  imageUrl: z.string().url().optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
});

export const toggleReactionSchema = z.object({
  emoji: z.enum(reactionEmojis),
});

// ============================================
// Milestones validation schemas
// ============================================

const milestoneTypes = ['birthday', 'anniversary', 'achievement', 'custom'] as const;

export const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  type: z.enum(milestoneTypes).optional().default('custom'),
  recurring: z.boolean().optional().default(false),
  emoji: z.string().max(50).optional(),
  personName: z.string().max(100).optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  type: z.enum(milestoneTypes).optional(),
  recurring: z.boolean().optional(),
  emoji: z.string().max(50).nullable().optional(),
  personName: z.string().max(100).nullable().optional(),
});

// ============================================
// Challenges validation schemas
// ============================================

const challengeTypes = ['fasting', 'exercise', 'custom'] as const;
const challengeStatuses = ['draft', 'active', 'completed', 'cancelled'] as const;
const fastingStatuses = ['fasting', 'feeding', 'broke_fast'] as const;

const fastingSettingsSchema = z.object({
  feedingWindowStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  feedingWindowEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  fastingHours: z.number().min(1).max(24),
});

export const createChallengeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().max(50).optional(),
  type: z.enum(challengeTypes).optional().default('fasting'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  settings: fastingSettingsSchema.optional(),
});

export const updateChallengeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  emoji: z.string().max(50).nullable().optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  settings: fastingSettingsSchema.optional(),
  status: z.enum(challengeStatuses).optional(),
});

export const createChallengeLogSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  completed: z.boolean().optional().default(false),
  notes: z.string().max(500).optional(),
  fastingStatus: z.enum(fastingStatuses).optional(),
});

// ============================================
// Health validation schemas
// ============================================

const weightUnits = ['lbs', 'kg'] as const;

export const createWeightLogSchema = z.object({
  weight: z.number().positive('Weight must be positive'),
  unit: z.enum(weightUnits).optional().default('lbs'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  notes: z.string().max(200).optional(),
});

export const createFoodLogSchema = z.object({
  challengeLogId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required').max(500),
  imageUrl: z.string().url().optional(),
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  fat: z.number().positive().optional(),
});

// ============================================
// Type exports from schemas
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type CreateChallengeLogInput = z.infer<typeof createChallengeLogSchema>;
export type CreateWeightLogInput = z.infer<typeof createWeightLogSchema>;
export type CreateFoodLogInput = z.infer<typeof createFoodLogSchema>;