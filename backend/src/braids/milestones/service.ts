import { prisma } from '../core/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '../core/validation.js';
import type { Milestone, MilestoneType, User } from '../core/types.js';

export class MilestonesService {
  static async createMilestone(familyId: string, userId: string, input: CreateMilestoneInput): Promise<Milestone> {
    await this.verifyMembership(familyId, userId);

    const milestone = await prisma.milestone.create({
      data: {
        familyId,
        createdById: userId,
        title: input.title,
        description: input.description,
        date: new Date(input.date),
        type: input.type || 'custom',
        recurring: input.recurring || false,
        emoji: input.emoji,
        personName: input.personName,
      },
      include: { createdBy: true },
    });

    return this.formatMilestone(milestone);
  }

  static async getFamilyMilestones(familyId: string, userId: string): Promise<Milestone[]> {
    await this.verifyMembership(familyId, userId);

    const milestones = await prisma.milestone.findMany({
      where: { familyId },
      include: { createdBy: true },
      orderBy: { date: 'asc' },
    });

    return milestones.map(m => this.formatMilestone(m));
  }

  static async getUpcomingMilestones(userId: string, days = 30): Promise<Milestone[]> {
    // Get all families user is in
    const memberships = await prisma.familyMember.findMany({
      where: { userId },
      select: { familyId: true },
    });

    const familyIds = memberships.map(m => m.familyId);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // For recurring events, we need to check if this year's occurrence is upcoming
    const milestones = await prisma.milestone.findMany({
      where: {
        familyId: { in: familyIds },
      },
      include: { createdBy: true },
    });

    const upcomingMilestones: Milestone[] = [];

    for (const m of milestones) {
      const formatted = this.formatMilestone(m);
      const originalDate = new Date(m.date);

      if (m.recurring) {
        // For recurring milestones, check this year and next year
        const thisYear = new Date(originalDate);
        thisYear.setFullYear(now.getFullYear());
        
        const nextYear = new Date(originalDate);
        nextYear.setFullYear(now.getFullYear() + 1);

        let checkDate = thisYear >= now ? thisYear : nextYear;
        
        if (checkDate <= futureDate) {
          const daysUntil = Math.ceil((checkDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          upcomingMilestones.push({ ...formatted, daysUntil });
        }
      } else {
        // Non-recurring - just check if in range
        if (originalDate >= now && originalDate <= futureDate) {
          const daysUntil = Math.ceil((originalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          upcomingMilestones.push({ ...formatted, daysUntil });
        }
      }
    }

    // Sort by days until
    return upcomingMilestones.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));
  }

  static async getMilestone(milestoneId: string, userId: string): Promise<Milestone> {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { createdBy: true },
    });

    if (!milestone) {
      throw new AppError(404, 'Milestone not found');
    }

    await this.verifyMembership(milestone.familyId, userId);

    return this.formatMilestone(milestone);
  }

  static async updateMilestone(milestoneId: string, userId: string, input: UpdateMilestoneInput): Promise<Milestone> {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new AppError(404, 'Milestone not found');
    }

    // Check if user is creator or family admin
    const isCreator = milestone.createdById === userId;
    const isAdmin = await this.isAdmin(milestone.familyId, userId);

    if (!isCreator && !isAdmin) {
      throw new AppError(403, 'You can only edit milestones you created');
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title: input.title,
        description: input.description,
        date: input.date ? new Date(input.date) : undefined,
        type: input.type,
        recurring: input.recurring,
        emoji: input.emoji,
        personName: input.personName,
      },
      include: { createdBy: true },
    });

    return this.formatMilestone(updated);
  }

  static async deleteMilestone(milestoneId: string, userId: string): Promise<void> {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new AppError(404, 'Milestone not found');
    }

    const isCreator = milestone.createdById === userId;
    const isAdmin = await this.isAdmin(milestone.familyId, userId);

    if (!isCreator && !isAdmin) {
      throw new AppError(403, 'You can only delete milestones you created');
    }

    await prisma.milestone.delete({ where: { id: milestoneId } });
  }

  // Helpers
  private static async verifyMembership(familyId: string, userId: string): Promise<void> {
    const member = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId } },
    });

    if (!member) {
      throw new AppError(403, 'You are not a member of this family');
    }
  }

  private static async isAdmin(familyId: string, userId: string): Promise<boolean> {
    const member = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId } },
    });
    return member?.role === 'admin';
  }

  private static formatMilestone(milestone: {
    id: string;
    familyId: string;
    createdById: string;
    title: string;
    description: string | null;
    date: Date;
    type: string;
    recurring: boolean;
    emoji: string | null;
    personName: string | null;
    createdAt: Date;
    createdBy: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date };
  }): Milestone {
    return {
      id: milestone.id,
      familyId: milestone.familyId,
      createdById: milestone.createdById,
      title: milestone.title,
      description: milestone.description,
      date: milestone.date.toISOString(),
      type: milestone.type as MilestoneType,
      recurring: milestone.recurring,
      emoji: milestone.emoji,
      personName: milestone.personName,
      createdAt: milestone.createdAt.toISOString(),
      createdBy: {
        id: milestone.createdBy.id,
        email: milestone.createdBy.email,
        name: milestone.createdBy.name,
        avatarUrl: milestone.createdBy.avatarUrl,
        createdAt: milestone.createdBy.createdAt.toISOString(),
      },
    };
  }
}
