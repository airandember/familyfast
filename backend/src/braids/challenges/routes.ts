import { Router } from 'express';
import { ChallengesService } from './service.js';
import { authenticate } from '../../middleware/auth.js';
import { createChallengeSchema, updateChallengeSchema, createChallengeLogSchema } from '../core/validation.js';

const router = Router();

router.use(authenticate);

// Challenge CRUD
router.post('/families/:familyId/challenges', async (req, res, next) => {
  try {
    const input = createChallengeSchema.parse(req.body);
    const challenge = await ChallengesService.createChallenge(req.params.familyId, req.user!.id, input);
    res.status(201).json({ data: challenge });
  } catch (error) {
    next(error);
  }
});

router.get('/families/:familyId/challenges', async (req, res, next) => {
  try {
    const challenges = await ChallengesService.getFamilyChallenges(req.params.familyId, req.user!.id);
    res.json({ data: challenges });
  } catch (error) {
    next(error);
  }
});

router.get('/challenges/:challengeId', async (req, res, next) => {
  try {
    const challenge = await ChallengesService.getChallenge(req.params.challengeId, req.user!.id);
    res.json({ data: challenge });
  } catch (error) {
    next(error);
  }
});

router.patch('/challenges/:challengeId', async (req, res, next) => {
  try {
    const input = updateChallengeSchema.parse(req.body);
    const challenge = await ChallengesService.updateChallenge(req.params.challengeId, req.user!.id, input);
    res.json({ data: challenge });
  } catch (error) {
    next(error);
  }
});

router.delete('/challenges/:challengeId', async (req, res, next) => {
  try {
    await ChallengesService.deleteChallenge(req.params.challengeId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Participants
router.post('/challenges/:challengeId/join', async (req, res, next) => {
  try {
    await ChallengesService.joinChallenge(req.params.challengeId, req.user!.id);
    res.status(201).json({ message: 'Joined challenge' });
  } catch (error) {
    next(error);
  }
});

router.post('/challenges/:challengeId/leave', async (req, res, next) => {
  try {
    await ChallengesService.leaveChallenge(req.params.challengeId, req.user!.id);
    res.json({ message: 'Left challenge' });
  } catch (error) {
    next(error);
  }
});

router.get('/challenges/:challengeId/participants', async (req, res, next) => {
  try {
    const participants = await ChallengesService.getParticipants(req.params.challengeId, req.user!.id);
    res.json({ data: participants });
  } catch (error) {
    next(error);
  }
});

// Daily Logs
router.post('/challenges/:challengeId/logs', async (req, res, next) => {
  try {
    const input = createChallengeLogSchema.parse(req.body);
    const log = await ChallengesService.logDay(req.params.challengeId, req.user!.id, input);
    res.status(201).json({ data: log });
  } catch (error) {
    next(error);
  }
});

router.get('/challenges/:challengeId/logs', async (req, res, next) => {
  try {
    const forUserId = req.query.userId as string | undefined;
    const logs = await ChallengesService.getLogs(req.params.challengeId, req.user!.id, forUserId);
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
});

export default router;
