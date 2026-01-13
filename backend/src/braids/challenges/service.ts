import { prisma } from '../core/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateChallengeInput, UpdateChallengeInput, CreateChallengeLogInput } from '../core/validation.js';
import type { Challenge, ChallengeParticipant, ChallengeLog, ChallengeProgress, FastingSettings, User } from '../core/types.js';

export class ChallengesService {
  // ============================================
  // Challenge CRUD
  // ============================================

  static async createChallenge(familyId: string, userId: string, input: CreateChallengeInput): Promise<Challenge> {
    await this.verifyMembership(familyId, userId);

    const challenge = await prisma.challenge.create({
      data: {
        familyId,
        createdById: userId,
        name: input.name,
        description: input.description,
        emoji: input.emoji,
        type: input.type || 'fasting',
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        settings: input.settings as any,
        status: 'active',
        participants: {
          create: { userId }, // Creator auto-joins
        },
      },
      include: {
        createdBy: true,
        _count: { select: { participants: true } },
        participants: { where: { userId } },
      },
    });

    return this.formatChallenge(challenge, userId);
  }

  static async getFamilyChallenges(familyId: string, userId: string): Promise<Challenge[]> {
    await this.verifyMembership(familyId, userId);

    const challenges = await prisma.challenge.findMany({
      where: { familyId },
      include: {
        createdBy: true,
        _count: { select: { participants: true } },
        participants: { where: { userId } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return challenges.map(c => this.formatChallenge(c, userId));
  }

  static async getChallenge(challengeId: string, userId: string): Promise<Challenge> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        createdBy: true,
        _count: { select: { participants: true } },
        participants: { where: { userId } },
      },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    await this.verifyMembership(challenge.familyId, userId);

    // Get user's progress if participating
    let myProgress: ChallengeProgress | undefined;
    if (challenge.participants.length > 0) {
      myProgress = await this.getParticipantProgress(challengeId, userId);
    }

    return { ...this.formatChallenge(challenge, userId), myProgress };
  }

  static async updateChallenge(challengeId: string, userId: string, input: UpdateChallengeInput): Promise<Challenge> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    // Only creator can update
    if (challenge.createdById !== userId) {
      throw new AppError(403, 'Only the creator can update this challenge');
    }

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        name: input.name,
        description: input.description,
        emoji: input.emoji,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        settings: input.settings as any,
        status: input.status,
      },
      include: {
        createdBy: true,
        _count: { select: { participants: true } },
        participants: { where: { userId } },
      },
    });

    return this.formatChallenge(updated, userId);
  }

  static async deleteChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    if (challenge.createdById !== userId) {
      throw new AppError(403, 'Only the creator can delete this challenge');
    }

    await prisma.challenge.delete({ where: { id: challengeId } });
  }

  // ============================================
  // Participants
  // ============================================

  static async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    await this.verifyMembership(challenge.familyId, userId);

    // Check if already participating
    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (existing) {
      throw new AppError(409, 'Already participating in this challenge');
    }

    await prisma.challengeParticipant.create({
      data: { challengeId, userId },
    });
  }

  static async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    await prisma.challengeParticipant.delete({
      where: { challengeId_userId: { challengeId, userId } },
    }).catch(() => {
      throw new AppError(404, 'Not a participant');
    });
  }

  static async getParticipants(challengeId: string, userId: string): Promise<ChallengeParticipant[]> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    await this.verifyMembership(challenge.familyId, userId);

    const participants = await prisma.challengeParticipant.findMany({
      where: { challengeId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    const result: ChallengeParticipant[] = [];
    for (const p of participants) {
      const progress = await this.getParticipantProgress(challengeId, p.userId);
      result.push({
        id: p.id,
        challengeId: p.challengeId,
        userId: p.userId,
        joinedAt: p.joinedAt.toISOString(),
        status: p.status,
        user: this.formatUser(p.user),
        progress,
      });
    }

    return result;
  }

  // ============================================
  // Daily Logs
  // ============================================

  static async logDay(challengeId: string, userId: string, input: CreateChallengeLogInput): Promise<ChallengeLog> {
    // Verify participation
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (!participant) {
      throw new AppError(403, 'You must join the challenge to log progress');
    }

    const logDate = new Date(input.date);
    logDate.setHours(0, 0, 0, 0);

    const log = await prisma.challengeLog.upsert({
      where: {
        challengeId_userId_date: {
          challengeId,
          userId,
          date: logDate,
        },
      },
      update: {
        completed: input.completed,
        notes: input.notes,
        fastingStatus: input.fastingStatus,
      },
      create: {
        challengeId,
        userId,
        date: logDate,
        completed: input.completed || false,
        notes: input.notes,
        fastingStatus: input.fastingStatus,
      },
      include: { foodLogs: true },
    });

    return this.formatChallengeLog(log);
  }

  static async getLogs(challengeId: string, userId: string, forUserId?: string): Promise<ChallengeLog[]> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    await this.verifyMembership(challenge.familyId, userId);

    const logs = await prisma.challengeLog.findMany({
      where: {
        challengeId,
        userId: forUserId || userId,
      },
      include: { foodLogs: true },
      orderBy: { date: 'desc' },
    });

    return logs.map(this.formatChallengeLog);
  }

  // ============================================
  // Progress Calculation
  // ============================================

  private static async getParticipantProgress(challengeId: string, userId: string): Promise<ChallengeProgress> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return { totalDays: 0, completedDays: 0, currentStreak: 0, completionRate: 0 };
    }

    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    
    // Total days in challenge (up to today)
    const effectiveEnd = end < now ? end : now;
    const totalDays = Math.max(0, Math.ceil((effectiveEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // Completed days
    const completedLogs = await prisma.challengeLog.count({
      where: { challengeId, userId, completed: true },
    });

    // Current streak (consecutive days ending today or yesterday)
    const logs = await prisma.challengeLog.findMany({
      where: { challengeId, userId, completed: true },
      orderBy: { date: 'desc' },
    });

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].date);
      logDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (logDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else if (i === 0) {
        // Check if yesterday was completed
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (logDate.getTime() === yesterday.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      totalDays,
      completedDays: completedLogs,
      currentStreak,
      completionRate: totalDays > 0 ? Math.round((completedLogs / totalDays) * 100) : 0,
    };
  }

  // ============================================
  // Helpers
  // ============================================

  private static async verifyMembership(familyId: string, userId: string): Promise<void> {
    const member = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId } },
    });

    if (!member) {
      throw new AppError(403, 'You are not a member of this family');
    }
  }

  private static formatUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private static formatChallenge(challenge: any, currentUserId: string): Challenge {
    return {
      id: challenge.id,
      familyId: challenge.familyId,
      createdById: challenge.createdById,
      name: challenge.name,
      description: challenge.description,
      emoji: challenge.emoji,
      type: challenge.type,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      settings: challenge.settings as FastingSettings | null,
      status: challenge.status,
      createdAt: challenge.createdAt.toISOString(),
      createdBy: this.formatUser(challenge.createdBy),
      participantCount: challenge._count.participants,
      isParticipating: challenge.participants?.length > 0,
    };
  }

  private static formatChallengeLog(log: any): ChallengeLog {
    return {
      id: log.id,
      challengeId: log.challengeId,
      userId: log.userId,
      date: log.date.toISOString().split('T')[0],
      completed: log.completed,
      notes: log.notes,
      fastingStatus: log.fastingStatus,
      createdAt: log.createdAt.toISOString(),
      foodLogs: log.foodLogs?.map((f: any) => ({
        id: f.id,
        userId: f.userId,
        challengeLogId: f.challengeLogId,
        description: f.description,
        imageUrl: f.imageUrl,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        loggedAt: f.loggedAt.toISOString(),
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }
}
