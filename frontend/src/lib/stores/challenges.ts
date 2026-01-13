import { writable, derived } from 'svelte/store';
import { api } from '$lib/api/client';
import type {
  Challenge,
  ChallengeParticipant,
  ChallengeLog,
  CreateChallengeRequest,
  CreateChallengeLogRequest,
} from '$lib/types';

interface ChallengesState {
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  participants: ChallengeParticipant[];
  logs: ChallengeLog[];
  loading: boolean;
  error: string | null;
}

function createChallengesStore() {
  const { subscribe, set, update } = writable<ChallengesState>({
    challenges: [],
    currentChallenge: null,
    participants: [],
    logs: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    // Load family challenges
    async loadChallenges(familyId: string) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: Challenge[] }>(
          `/api/families/${familyId}/challenges`
        );
        update((s) => ({ ...s, challenges: response.data, loading: false }));
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to load challenges',
        }));
      }
    },

    // Get single challenge with details
    async loadChallenge(challengeId: string) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: Challenge }>(
          `/api/challenges/${challengeId}`
        );
        update((s) => ({ ...s, currentChallenge: response.data, loading: false }));
        return response.data;
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to load challenge',
        }));
        return null;
      }
    },

    // Create new challenge
    async createChallenge(familyId: string, input: CreateChallengeRequest) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.post<{ data: Challenge }>(
          `/api/families/${familyId}/challenges`,
          input
        );
        update((s) => ({
          ...s,
          challenges: [response.data, ...s.challenges],
          loading: false,
        }));
        return response.data;
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to create challenge',
        }));
        return null;
      }
    },

    // Join challenge
    async joinChallenge(challengeId: string) {
      try {
        await api.post(`/api/challenges/${challengeId}/join`);
        // Refresh challenge to get updated participation status
        update((s) => ({
          ...s,
          challenges: s.challenges.map((c) =>
            c.id === challengeId
              ? { ...c, isParticipating: true, participantCount: c.participantCount + 1 }
              : c
          ),
          currentChallenge:
            s.currentChallenge?.id === challengeId
              ? { ...s.currentChallenge, isParticipating: true, participantCount: s.currentChallenge.participantCount + 1 }
              : s.currentChallenge,
        }));
        return true;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to join challenge' }));
        return false;
      }
    },

    // Leave challenge
    async leaveChallenge(challengeId: string) {
      try {
        await api.post(`/api/challenges/${challengeId}/leave`);
        update((s) => ({
          ...s,
          challenges: s.challenges.map((c) =>
            c.id === challengeId
              ? { ...c, isParticipating: false, participantCount: Math.max(0, c.participantCount - 1) }
              : c
          ),
          currentChallenge:
            s.currentChallenge?.id === challengeId
              ? { ...s.currentChallenge, isParticipating: false, participantCount: Math.max(0, s.currentChallenge.participantCount - 1) }
              : s.currentChallenge,
        }));
        return true;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to leave challenge' }));
        return false;
      }
    },

    // Load participants
    async loadParticipants(challengeId: string) {
      try {
        const response = await api.get<{ data: ChallengeParticipant[] }>(
          `/api/challenges/${challengeId}/participants`
        );
        update((s) => ({ ...s, participants: response.data }));
        return response.data;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to load participants' }));
        return [];
      }
    },

    // Log daily progress
    async logDay(challengeId: string, input: CreateChallengeLogRequest) {
      try {
        const response = await api.post<{ data: ChallengeLog }>(
          `/api/challenges/${challengeId}/logs`,
          input
        );
        update((s) => {
          // Update or add log
          const existingIndex = s.logs.findIndex(
            (l) => l.date === response.data.date && l.userId === response.data.userId
          );
          const newLogs =
            existingIndex >= 0
              ? s.logs.map((l, i) => (i === existingIndex ? response.data : l))
              : [response.data, ...s.logs];
          return { ...s, logs: newLogs };
        });
        return response.data;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to log day' }));
        return null;
      }
    },

    // Load logs for a challenge
    async loadLogs(challengeId: string, userId?: string) {
      try {
        const url = userId
          ? `/api/challenges/${challengeId}/logs?userId=${userId}`
          : `/api/challenges/${challengeId}/logs`;
        const response = await api.get<{ data: ChallengeLog[] }>(url);
        update((s) => ({ ...s, logs: response.data }));
        return response.data;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to load logs' }));
        return [];
      }
    },

    // Delete challenge
    async deleteChallenge(challengeId: string) {
      try {
        await api.delete(`/api/challenges/${challengeId}`);
        update((s) => ({
          ...s,
          challenges: s.challenges.filter((c) => c.id !== challengeId),
          currentChallenge: s.currentChallenge?.id === challengeId ? null : s.currentChallenge,
        }));
        return true;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to delete challenge' }));
        return false;
      }
    },

    // Clear error
    clearError() {
      update((s) => ({ ...s, error: null }));
    },

    // Reset store
    reset() {
      set({
        challenges: [],
        currentChallenge: null,
        participants: [],
        logs: [],
        loading: false,
        error: null,
      });
    },
  };
}

export const challengesStore = createChallengesStore();

// Derived store for active challenges
export const activeChallenges = derived(challengesStore, ($store) =>
  $store.challenges.filter((c) => c.status === 'active')
);

// Derived store for user's challenges
export const myChallenges = derived(challengesStore, ($store) =>
  $store.challenges.filter((c) => c.isParticipating)
);
