import { nanoid } from 'nanoid';
import { prisma } from '../core/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateFamilyInput, UpdateFamilyInput } from '../core/validation.js';
import type { Family, FamilyMember, FamilyWithMembers, User } from '../core/types.js';

export class FamilyService {
  static async createFamily(userId: string, input: CreateFamilyInput): Promise<FamilyWithMembers> {
    const inviteCode = nanoid(10);

    const family = await prisma.family.create({
      data: {
        name: input.name,
        description: input.description,
        color: input.color || 'orange',
        emoji: input.emoji,
        inviteCode,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.formatFamilyWithMembers(family);
  }

  static async getUserFamilies(userId: string): Promise<Family[]> {
    const families = await prisma.family.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return families.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      avatarUrl: f.avatarUrl,
      color: f.color as Family['color'],
      emoji: f.emoji,
      inviteCode: f.inviteCode,
      createdAt: f.createdAt.toISOString(),
      memberCount: f._count.members,
    }));
  }

  static async getFamily(familyId: string, userId: string): Promise<FamilyWithMembers> {
    // Verify user is a member
    await this.verifyMembership(familyId, userId);

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!family) {
      throw new AppError(404, 'Family not found');
    }

    return this.formatFamilyWithMembers(family);
  }

  static async updateFamily(
    familyId: string,
    userId: string,
    input: UpdateFamilyInput
  ): Promise<Family> {
    // Verify user is an admin
    await this.verifyAdmin(familyId, userId);

    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        emoji: input.emoji,
      },
    });

    return this.formatFamily(family);
  }

  static async deleteFamily(familyId: string, userId: string): Promise<void> {
    // Verify user is an admin
    await this.verifyAdmin(familyId, userId);

    await prisma.family.delete({
      where: { id: familyId },
    });
  }

  static async joinFamily(userId: string, inviteCode: string): Promise<FamilyWithMembers> {
    const family = await prisma.family.findUnique({
      where: { inviteCode },
    });

    if (!family) {
      throw new AppError(404, 'Invalid invite code');
    }

    // Check if already a member
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId,
          familyId: family.id,
        },
      },
    });

    if (existingMember) {
      throw new AppError(409, 'You are already a member of this family');
    }

    // Add as member
    await prisma.familyMember.create({
      data: {
        userId,
        familyId: family.id,
        role: 'member',
      },
    });

    return this.getFamily(family.id, userId);
  }

  static async getMembers(familyId: string, userId: string): Promise<FamilyMember[]> {
    await this.verifyMembership(familyId, userId);

    const members = await prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map(this.formatMember);
  }

  static async updateMemberRole(
    familyId: string,
    memberId: string,
    adminId: string,
    role: 'admin' | 'member'
  ): Promise<FamilyMember> {
    await this.verifyAdmin(familyId, adminId);

    // Get the member
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: memberId,
      },
    });

    if (!member) {
      throw new AppError(404, 'Member not found');
    }

    // Cannot demote yourself if you're the only admin
    if (adminId === memberId && role === 'member') {
      const adminCount = await prisma.familyMember.count({
        where: { familyId, role: 'admin' },
      });

      if (adminCount === 1) {
        throw new AppError(400, 'Cannot remove the last admin');
      }
    }

    const updated = await prisma.familyMember.update({
      where: { id: member.id },
      data: { role },
      include: { user: true },
    });

    return this.formatMember(updated);
  }

  static async removeMember(
    familyId: string,
    memberId: string,
    adminId: string
  ): Promise<void> {
    // Allow members to leave themselves
    if (memberId !== adminId) {
      await this.verifyAdmin(familyId, adminId);
    }

    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: memberId,
      },
    });

    if (!member) {
      throw new AppError(404, 'Member not found');
    }

    // Check if this is the last admin
    if (member.role === 'admin') {
      const adminCount = await prisma.familyMember.count({
        where: { familyId, role: 'admin' },
      });

      if (adminCount === 1) {
        // Get total member count
        const memberCount = await prisma.familyMember.count({
          where: { familyId },
        });

        if (memberCount > 1) {
          throw new AppError(400, 'Cannot leave as the last admin. Promote another member first.');
        }

        // Last member leaving - delete the family
        await prisma.family.delete({
          where: { id: familyId },
        });
        return;
      }
    }

    await prisma.familyMember.delete({
      where: { id: member.id },
    });
  }

  static async regenerateInviteCode(familyId: string, userId: string): Promise<string> {
    await this.verifyAdmin(familyId, userId);

    const newCode = nanoid(10);

    await prisma.family.update({
      where: { id: familyId },
      data: { inviteCode: newCode },
    });

    return newCode;
  }

  // Helper methods
  private static async verifyMembership(familyId: string, userId: string): Promise<void> {
    const member = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId,
          familyId,
        },
      },
    });

    if (!member) {
      throw new AppError(403, 'You are not a member of this family');
    }
  }

  private static async verifyAdmin(familyId: string, userId: string): Promise<void> {
    const member = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId,
          familyId,
        },
      },
    });

    if (!member || member.role !== 'admin') {
      throw new AppError(403, 'Only admins can perform this action');
    }
  }

  private static formatFamily(family: {
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    color: string;
    emoji: string | null;
    inviteCode: string;
    createdAt: Date;
  }): Family {
    return {
      id: family.id,
      name: family.name,
      description: family.description,
      avatarUrl: family.avatarUrl,
      color: family.color as Family['color'],
      emoji: family.emoji,
      inviteCode: family.inviteCode,
      createdAt: family.createdAt.toISOString(),
    };
  }

  private static formatFamilyWithMembers(family: {
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    color: string;
    emoji: string | null;
    inviteCode: string;
    createdAt: Date;
    members: Array<{
      id: string;
      userId: string;
      familyId: string;
      role: string;
      joinedAt: Date;
      user: {
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        createdAt: Date;
      };
    }>;
  }): FamilyWithMembers {
    return {
      ...this.formatFamily(family),
      members: family.members.map(this.formatMember),
    };
  }

  private static formatMember(member: {
    id: string;
    userId: string;
    familyId: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
      createdAt: Date;
    };
  }): FamilyMember {
    return {
      id: member.id,
      userId: member.userId,
      familyId: member.familyId,
      role: member.role as 'admin' | 'member',
      joinedAt: member.joinedAt.toISOString(),
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        createdAt: member.user.createdAt.toISOString(),
      },
    };
  }
}
