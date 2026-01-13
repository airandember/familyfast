import { Router } from 'express';
import { FamilyService } from './service.js';
import { authenticate } from '../../middleware/auth.js';
import {
  createFamilySchema,
  updateFamilySchema,
  joinFamilySchema,
} from '../core/validation.js';

export const familyRouter = Router();

// All family routes require authentication
familyRouter.use(authenticate);

// POST /api/families - Create a new family
familyRouter.post('/', async (req, res, next) => {
  try {
    const data = createFamilySchema.parse(req.body);
    const family = await FamilyService.createFamily(req.user!.id, data);
    res.status(201).json(family);
  } catch (error) {
    next(error);
  }
});

// GET /api/families - Get user's families
familyRouter.get('/', async (req, res, next) => {
  try {
    const families = await FamilyService.getUserFamilies(req.user!.id);
    res.json(families);
  } catch (error) {
    next(error);
  }
});

// POST /api/families/join - Join a family with invite code
familyRouter.post('/join', async (req, res, next) => {
  try {
    const { inviteCode } = joinFamilySchema.parse(req.body);
    const family = await FamilyService.joinFamily(req.user!.id, inviteCode);
    res.json(family);
  } catch (error) {
    next(error);
  }
});

// GET /api/families/:id - Get family details
familyRouter.get('/:id', async (req, res, next) => {
  try {
    const family = await FamilyService.getFamily(req.params.id, req.user!.id);
    res.json(family);
  } catch (error) {
    next(error);
  }
});

// PUT /api/families/:id - Update family
familyRouter.put('/:id', async (req, res, next) => {
  try {
    const data = updateFamilySchema.parse(req.body);
    const family = await FamilyService.updateFamily(req.params.id, req.user!.id, data);
    res.json(family);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/families/:id - Delete family
familyRouter.delete('/:id', async (req, res, next) => {
  try {
    await FamilyService.deleteFamily(req.params.id, req.user!.id);
    res.json({ message: 'Family deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/families/:id/members - Get family members
familyRouter.get('/:id/members', async (req, res, next) => {
  try {
    const members = await FamilyService.getMembers(req.params.id, req.user!.id);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// PUT /api/families/:id/members/:userId - Update member role
familyRouter.put('/:id/members/:userId', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const member = await FamilyService.updateMemberRole(
      req.params.id,
      req.params.userId,
      req.user!.id,
      role
    );
    res.json(member);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/families/:id/members/:userId - Remove member
familyRouter.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    await FamilyService.removeMember(
      req.params.id,
      req.params.userId,
      req.user!.id
    );
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/families/:id/invite/regenerate - Regenerate invite code
familyRouter.post('/:id/invite/regenerate', async (req, res, next) => {
  try {
    const inviteCode = await FamilyService.regenerateInviteCode(
      req.params.id,
      req.user!.id
    );
    res.json({ inviteCode });
  } catch (error) {
    next(error);
  }
});
