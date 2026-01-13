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

// Type exports from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>;
