import { prisma } from '../core/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateWeightLogInput, CreateFoodLogInput } from '../core/validation.js';
import type { WeightLog, FoodLog, WeightTrend } from '../core/types.js';

export class HealthService {
  // ============================================
  // Weight Logs
  // ============================================

  static async logWeight(userId: string, input: CreateWeightLogInput): Promise<WeightLog> {
    const logDate = new Date(input.date);
    logDate.setHours(0, 0, 0, 0);

    const log = await prisma.weightLog.upsert({
      where: {
        userId_date: { userId, date: logDate },
      },
      update: {
        weight: input.weight,
        unit: input.unit || 'lbs',
        notes: input.notes,
      },
      create: {
        userId,
        weight: input.weight,
        unit: input.unit || 'lbs',
        date: logDate,
        notes: input.notes,
      },
    });

    return this.formatWeightLog(log);
  }

  static async getWeightLogs(userId: string, days: number = 30): Promise<WeightLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.weightLog.findMany({
      where: {
        userId,
        date: { gte: since },
      },
      orderBy: { date: 'desc' },
    });

    return logs.map(this.formatWeightLog);
  }

  static async getWeightTrend(userId: string, days: number = 30): Promise<WeightTrend[]> {
    const logs = await this.getWeightLogs(userId, days);
    
    // Sort ascending for trend calculation
    const sorted = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const trends: WeightTrend[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const change = i > 0 ? sorted[i].weight - sorted[i - 1].weight : undefined;
      trends.push({
        date: sorted[i].date,
        weight: sorted[i].weight,
        change,
      });
    }

    return trends;
  }

  static async deleteWeightLog(userId: string, date: string): Promise<void> {
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    await prisma.weightLog.delete({
      where: {
        userId_date: { userId, date: logDate },
      },
    }).catch(() => {
      throw new AppError(404, 'Weight log not found');
    });
  }

  // ============================================
  // Food Logs
  // ============================================

  static async logFood(userId: string, input: CreateFoodLogInput): Promise<FoodLog> {
    // Verify challenge log ownership if provided
    if (input.challengeLogId) {
      const challengeLog = await prisma.challengeLog.findUnique({
        where: { id: input.challengeLogId },
      });

      if (!challengeLog || challengeLog.userId !== userId) {
        throw new AppError(403, 'Invalid challenge log');
      }
    }

    const log = await prisma.foodLog.create({
      data: {
        userId,
        challengeLogId: input.challengeLogId,
        description: input.description,
        imageUrl: input.imageUrl,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
      },
    });

    return this.formatFoodLog(log);
  }

  static async getFoodLogs(userId: string, date?: string, challengeLogId?: string): Promise<FoodLog[]> {
    const where: any = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.loggedAt = { gte: startOfDay, lte: endOfDay };
    }

    if (challengeLogId) {
      where.challengeLogId = challengeLogId;
    }

    const logs = await prisma.foodLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
    });

    return logs.map(this.formatFoodLog);
  }

  static async deleteFoodLog(userId: string, foodLogId: string): Promise<void> {
    const log = await prisma.foodLog.findUnique({
      where: { id: foodLogId },
    });

    if (!log || log.userId !== userId) {
      throw new AppError(404, 'Food log not found');
    }

    await prisma.foodLog.delete({ where: { id: foodLogId } });
  }

  // Get daily summary (macros totals)
  static async getDailySummary(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await prisma.foodLog.aggregate({
      where: {
        userId,
        loggedAt: { gte: startOfDay, lte: endOfDay },
      },
      _sum: {
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
      },
      _count: true,
    });

    return {
      date,
      totalMeals: result._count,
      calories: result._sum.calories || 0,
      protein: result._sum.protein || 0,
      carbs: result._sum.carbs || 0,
      fat: result._sum.fat || 0,
    };
  }

  // ============================================
  // Helpers
  // ============================================

  private static formatWeightLog(log: any): WeightLog {
    return {
      id: log.id,
      userId: log.userId,
      weight: log.weight,
      unit: log.unit,
      date: log.date.toISOString().split('T')[0],
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
    };
  }

  private static formatFoodLog(log: any): FoodLog {
    return {
      id: log.id,
      userId: log.userId,
      challengeLogId: log.challengeLogId,
      description: log.description,
      imageUrl: log.imageUrl,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      loggedAt: log.loggedAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
    };
  }
}
