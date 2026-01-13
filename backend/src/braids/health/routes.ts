import { Router } from 'express';
import { HealthService } from './service.js';
import { authenticate } from '../../middleware/auth.js';
import { createWeightLogSchema, createFoodLogSchema } from '../core/validation.js';

const router = Router();

router.use(authenticate);

// Weight Logs
router.post('/weight', async (req, res, next) => {
  try {
    const input = createWeightLogSchema.parse(req.body);
    const log = await HealthService.logWeight(req.user!.id, input);
    res.status(201).json({ data: log });
  } catch (error) {
    next(error);
  }
});

router.get('/weight', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const logs = await HealthService.getWeightLogs(req.user!.id, days);
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
});

router.get('/weight/trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trend = await HealthService.getWeightTrend(req.user!.id, days);
    res.json({ data: trend });
  } catch (error) {
    next(error);
  }
});

router.delete('/weight/:date', async (req, res, next) => {
  try {
    await HealthService.deleteWeightLog(req.user!.id, req.params.date);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Food Logs
router.post('/food', async (req, res, next) => {
  try {
    const input = createFoodLogSchema.parse(req.body);
    const log = await HealthService.logFood(req.user!.id, input);
    res.status(201).json({ data: log });
  } catch (error) {
    next(error);
  }
});

router.get('/food', async (req, res, next) => {
  try {
    const date = req.query.date as string | undefined;
    const challengeLogId = req.query.challengeLogId as string | undefined;
    const logs = await HealthService.getFoodLogs(req.user!.id, date, challengeLogId);
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
});

router.delete('/food/:foodLogId', async (req, res, next) => {
  try {
    await HealthService.deleteFoodLog(req.user!.id, req.params.foodLogId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/food/summary/:date', async (req, res, next) => {
  try {
    const summary = await HealthService.getDailySummary(req.user!.id, req.params.date);
    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

export default router;
