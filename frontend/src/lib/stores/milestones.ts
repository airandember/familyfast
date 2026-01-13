import { writable } from 'svelte/store';
import { api } from '$lib/api/client';
import type { Milestone, CreateMilestoneRequest, UpdateMilestoneRequest } from '$lib/types';

interface MilestonesState {
  milestones: Milestone[];
  upcoming: Milestone[];
  loading: boolean;
  error: string | null;
}

function createMilestonesStore() {
  const { subscribe, set, update } = writable<MilestonesState>({
    milestones: [],
    upcoming: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    async loadFamilyMilestones(familyId: string) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: Milestone[] }>(
          `/api/families/${familyId}/milestones`
        );
        update(s => ({ ...s, milestones: response.data, loading: false }));
      } catch (error: any) {
        update(s => ({ ...s, loading: false, error: error.message }));
      }
    },

    async loadUpcoming(days = 30) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: Milestone[] }>(
          `/api/milestones/upcoming?days=${days}`
        );
        update(s => ({ ...s, upcoming: response.data, loading: false }));
      } catch (error: any) {
        update(s => ({ ...s, loading: false, error: error.message }));
      }
    },

    async createMilestone(familyId: string, input: CreateMilestoneRequest) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.post<{ data: Milestone }>(
          `/api/families/${familyId}/milestones`,
          input
        );
        update(s => ({
          ...s,
          milestones: [...s.milestones, response.data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
          loading: false,
        }));
        return response.data;
      } catch (error: any) {
        update(s => ({ ...s, loading: false, error: error.message }));
        throw error;
      }
    },

    async updateMilestone(milestoneId: string, input: UpdateMilestoneRequest) {
      try {
        const response = await api.patch<{ data: Milestone }>(
          `/api/milestones/${milestoneId}`,
          input
        );
        update(s => ({
          ...s,
          milestones: s.milestones.map(m =>
            m.id === milestoneId ? response.data : m
          ),
        }));
        return response.data;
      } catch (error: any) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    async deleteMilestone(milestoneId: string) {
      try {
        await api.delete(`/api/milestones/${milestoneId}`);
        update(s => ({
          ...s,
          milestones: s.milestones.filter(m => m.id !== milestoneId),
          upcoming: s.upcoming.filter(m => m.id !== milestoneId),
        }));
      } catch (error: any) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    reset() {
      set({ milestones: [], upcoming: [], loading: false, error: null });
    },
  };
}

export const milestonesStore = createMilestonesStore();
