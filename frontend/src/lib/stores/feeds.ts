import { writable } from 'svelte/store';
import { api } from '$lib/api/client';
import type { Post, Comment, ReactionType, CreatePostRequest, CreateCommentRequest } from '$lib/types';

interface FeedsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

function createFeedsStore() {
  const { subscribe, set, update } = writable<FeedsState>({
    posts: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  });

  return {
    subscribe,
    
    async loadPosts(familyId: string, page = 1) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: Post[]; total: number; page: number; pageSize: number; totalPages: number }>(
          `/api/families/${familyId}/posts?page=${page}&pageSize=20`
        );
        update(s => ({
          ...s,
          posts: page === 1 ? response.data : [...s.posts, ...response.data],
          loading: false,
          currentPage: page,
          totalPages: response.totalPages,
          hasMore: page < response.totalPages,
        }));
      } catch (error: any) {
        update(s => ({ ...s, loading: false, error: error.message }));
      }
    },

    async createPost(familyId: string, input: CreatePostRequest) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.post<{ data: Post }>(
          `/api/families/${familyId}/posts`,
          input
        );
        update(s => ({
          ...s,
          posts: [response.data, ...s.posts],
          loading: false,
        }));
        return response.data;
      } catch (error: any) {
        update(s => ({ ...s, loading: false, error: error.message }));
        throw error;
      }
    },

    async deletePost(postId: string) {
      try {
        await api.delete(`/api/posts/${postId}`);
        update(s => ({
          ...s,
          posts: s.posts.filter(p => p.id !== postId),
        }));
      } catch (error: any) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    async toggleReaction(postId: string, emoji: ReactionType) {
      try {
        const response = await api.post<{ data: { emoji: ReactionType; count: number }[] }>(
          `/api/posts/${postId}/reactions`,
          { emoji }
        );
        update(s => ({
          ...s,
          posts: s.posts.map(p => {
            if (p.id !== postId) return p;
            const currentReaction = p.userReaction;
            return {
              ...p,
              reactions: response.data,
              userReaction: currentReaction === emoji ? null : emoji,
            };
          }),
        }));
      } catch (error: any) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    reset() {
      set({
        posts: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
      });
    },
  };
}

export const feedsStore = createFeedsStore();

// Comments store for a specific post
interface CommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

function createCommentsStore() {
  const { subscribe, set, update } = writable<CommentsState>({
    comments: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    async loadComments(postId: string) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: Comment[] }>(`/api/posts/${postId}/comments`);
        update(s => ({ ...s, comments: response.data, loading: false }));
      } catch (error: any) {
        update(s => ({ ...s, loading: false, error: error.message }));
      }
    },

    async addComment(postId: string, input: CreateCommentRequest) {
      try {
        const response = await api.post<{ data: Comment }>(
          `/api/posts/${postId}/comments`,
          input
        );
        update(s => ({
          ...s,
          comments: [...s.comments, response.data],
        }));
        return response.data;
      } catch (error: any) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    async deleteComment(commentId: string) {
      try {
        await api.delete(`/api/comments/${commentId}`);
        update(s => ({
          ...s,
          comments: s.comments.filter(c => c.id !== commentId),
        }));
      } catch (error: any) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    reset() {
      set({ comments: [], loading: false, error: null });
    },
  };
}

export const commentsStore = createCommentsStore();
