import { Router } from 'express';
import { MilestonesService } from './service.js';
import { authenticate } from '../../middleware/auth.js';
import { createMilestoneSchema, updateMilestoneSchema } from '../core/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Milestones
router.post('/families/:familyId/milestones', async (req, res, next) => {
  try {
    const input = createMilestoneSchema.parse(req.body);
    const milestone = await MilestonesService.createMilestone(req.params.familyId, req.user!.id, input);
    res.status(201).json({ data: milestone });
  } catch (error) {
    next(error);
  }
});

router.get('/families/:familyId/milestones', async (req, res, next) => {
  try {
    const milestones = await MilestonesService.getFamilyMilestones(req.params.familyId, req.user!.id);
    res.json({ data: milestones });
  } catch (error) {
    next(error);
  }
});

// Get upcoming milestones across all families
router.get('/milestones/upcoming', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const milestones = await MilestonesService.getUpcomingMilestones(req.user!.id, days);
    res.json({ data: milestones });
  } catch (error) {
    next(error);
  }
});

router.get('/milestones/:milestoneId', async (req, res, next) => {
  try {
    const milestone = await MilestonesService.getMilestone(req.params.milestoneId, req.user!.id);
    res.json({ data: milestone });
  } catch (error) {
    next(error);
  }
});

router.patch('/milestones/:milestoneId', async (req, res, next) => {
  try {
    const input = updateMilestoneSchema.parse(req.body);
    const milestone = await MilestonesService.updateMilestone(req.params.milestoneId, req.user!.id, input);
    res.json({ data: milestone });
  } catch (error) {
    next(error);
  }
});

router.delete('/milestones/:milestoneId', async (req, res, next) => {
  try {
    await MilestonesService.deleteMilestone(req.params.milestoneId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
