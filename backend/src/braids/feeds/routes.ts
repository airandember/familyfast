import { Router } from 'express';
import { FeedsService } from './service.js';
import { authenticate } from '../../middleware/auth.js';
import { createPostSchema, updatePostSchema, createCommentSchema, toggleReactionSchema } from '../core/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Posts
router.post('/families/:familyId/posts', async (req, res, next) => {
  try {
    const input = createPostSchema.parse(req.body);
    const post = await FeedsService.createPost(req.params.familyId, req.user!.id, input);
    res.status(201).json({ data: post });
  } catch (error) {
    next(error);
  }
});

router.get('/families/:familyId/posts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await FeedsService.getFamilyPosts(req.params.familyId, req.user!.id, page, pageSize);
    res.json({
      data: result.posts,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/posts/:postId', async (req, res, next) => {
  try {
    const post = await FeedsService.getPost(req.params.postId, req.user!.id);
    res.json({ data: post });
  } catch (error) {
    next(error);
  }
});

router.patch('/posts/:postId', async (req, res, next) => {
  try {
    const input = updatePostSchema.parse(req.body);
    const post = await FeedsService.updatePost(req.params.postId, req.user!.id, input);
    res.json({ data: post });
  } catch (error) {
    next(error);
  }
});

router.delete('/posts/:postId', async (req, res, next) => {
  try {
    await FeedsService.deletePost(req.params.postId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Comments
router.post('/posts/:postId/comments', async (req, res, next) => {
  try {
    const input = createCommentSchema.parse(req.body);
    const comment = await FeedsService.addComment(req.params.postId, req.user!.id, input);
    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
});

router.get('/posts/:postId/comments', async (req, res, next) => {
  try {
    const comments = await FeedsService.getComments(req.params.postId, req.user!.id);
    res.json({ data: comments });
  } catch (error) {
    next(error);
  }
});

router.delete('/comments/:commentId', async (req, res, next) => {
  try {
    await FeedsService.deleteComment(req.params.commentId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Reactions
router.post('/posts/:postId/reactions', async (req, res, next) => {
  try {
    const input = toggleReactionSchema.parse(req.body);
    const reactions = await FeedsService.toggleReaction(req.params.postId, req.user!.id, input);
    res.json({ data: reactions });
  } catch (error) {
    next(error);
  }
});

export default router;
