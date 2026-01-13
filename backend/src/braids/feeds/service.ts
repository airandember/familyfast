import { prisma } from '../core/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreatePostInput, UpdatePostInput, CreateCommentInput, ToggleReactionInput } from '../core/validation.js';
import type { Post, Comment, ReactionSummary, User, ReactionType } from '../core/types.js';

export class FeedsService {
  // Posts
  static async createPost(familyId: string, userId: string, input: CreatePostInput): Promise<Post> {
    await this.verifyMembership(familyId, userId);

    const post = await prisma.post.create({
      data: {
        familyId,
        authorId: userId,
        content: input.content,
        imageUrl: input.imageUrl,
      },
      include: {
        author: true,
        _count: { select: { comments: true } },
        reactions: true,
      },
    });

    return this.formatPost(post, userId);
  }

  static async getFamilyPosts(
    familyId: string,
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ posts: Post[]; total: number }> {
    await this.verifyMembership(familyId, userId);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { familyId },
        include: {
          author: true,
          _count: { select: { comments: true } },
          reactions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where: { familyId } }),
    ]);

    return {
      posts: posts.map(p => this.formatPost(p, userId)),
      total,
    };
  }

  static async getPost(postId: string, userId: string): Promise<Post> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        _count: { select: { comments: true } },
        reactions: true,
      },
    });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    await this.verifyMembership(post.familyId, userId);

    return this.formatPost(post, userId);
  }

  static async updatePost(postId: string, userId: string, input: UpdatePostInput): Promise<Post> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    if (post.authorId !== userId) {
      throw new AppError(403, 'You can only edit your own posts');
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        content: input.content,
        imageUrl: input.imageUrl,
      },
      include: {
        author: true,
        _count: { select: { comments: true } },
        reactions: true,
      },
    });

    return this.formatPost(updated, userId);
  }

  static async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    // Check if author or family admin
    const isAuthor = post.authorId === userId;
    const isAdmin = await this.isAdmin(post.familyId, userId);

    if (!isAuthor && !isAdmin) {
      throw new AppError(403, 'You can only delete your own posts');
    }

    await prisma.post.delete({ where: { id: postId } });
  }

  // Comments
  static async addComment(postId: string, userId: string, input: CreateCommentInput): Promise<Comment> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    await this.verifyMembership(post.familyId, userId);

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: input.content,
      },
      include: { author: true },
    });

    return this.formatComment(comment);
  }

  static async getComments(postId: string, userId: string): Promise<Comment[]> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    await this.verifyMembership(post.familyId, userId);

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map(this.formatComment);
  }

  static async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }

    const isAuthor = comment.authorId === userId;
    const isAdmin = await this.isAdmin(comment.post.familyId, userId);

    if (!isAuthor && !isAdmin) {
      throw new AppError(403, 'You can only delete your own comments');
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }

  // Reactions
  static async toggleReaction(postId: string, userId: string, input: ToggleReactionInput): Promise<ReactionSummary[]> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    await this.verifyMembership(post.familyId, userId);

    // Check for existing reaction
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existing) {
      if (existing.emoji === input.emoji) {
        // Same emoji - remove reaction
        await prisma.reaction.delete({
          where: { id: existing.id },
        });
      } else {
        // Different emoji - update
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { emoji: input.emoji },
        });
      }
    } else {
      // Create new reaction
      await prisma.reaction.create({
        data: {
          postId,
          userId,
          emoji: input.emoji,
        },
      });
    }

    // Return updated reaction counts
    return this.getReactionSummary(postId);
  }

  private static async getReactionSummary(postId: string): Promise<ReactionSummary[]> {
    const reactions = await prisma.reaction.groupBy({
      by: ['emoji'],
      where: { postId },
      _count: { emoji: true },
    });

    return reactions.map(r => ({
      emoji: r.emoji as ReactionType,
      count: r._count.emoji,
    }));
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

  private static formatPost(post: {
    id: string;
    familyId: string;
    authorId: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date };
    _count: { comments: number };
    reactions: Array<{ emoji: string; userId: string }>;
  }, currentUserId: string): Post {
    const reactionCounts = new Map<string, number>();
    let userReaction: ReactionType | null = null;

    for (const r of post.reactions) {
      reactionCounts.set(r.emoji, (reactionCounts.get(r.emoji) || 0) + 1);
      if (r.userId === currentUserId) {
        userReaction = r.emoji as ReactionType;
      }
    }

    return {
      id: post.id,
      familyId: post.familyId,
      authorId: post.authorId,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: {
        id: post.author.id,
        email: post.author.email,
        name: post.author.name,
        avatarUrl: post.author.avatarUrl,
        createdAt: post.author.createdAt.toISOString(),
      },
      commentCount: post._count.comments,
      reactions: Array.from(reactionCounts.entries()).map(([emoji, count]) => ({
        emoji: emoji as ReactionType,
        count,
      })),
      userReaction,
    };
  }

  private static formatComment(comment: {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: Date;
    author: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date };
  }): Comment {
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        email: comment.author.email,
        name: comment.author.name,
        avatarUrl: comment.author.avatarUrl,
        createdAt: comment.author.createdAt.toISOString(),
      },
    };
  }
}
