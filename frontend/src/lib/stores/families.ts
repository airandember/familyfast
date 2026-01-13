import { writable, derived } from 'svelte/store';
import { api, ApiError } from '$lib/api/client';
import type { Family, FamilyWithMembers, CreateFamilyRequest, UpdateFamilyRequest } from '$lib/types';

interface FamiliesState {
  families: Family[];
  currentFamily: FamilyWithMembers | null;
  loading: boolean;
  error: string | null;
}

function createFamiliesStore() {
  const { subscribe, set, update } = writable<FamiliesState>({
    families: [],
    currentFamily: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    async loadFamilies() {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const families = await api.get<Family[]>('/api/families');
        update(s => ({ ...s, families, loading: false }));
        return families;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load families';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async loadFamily(id: string) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const family = await api.get<FamilyWithMembers>(`/api/families/${id}`);
        update(s => ({ ...s, currentFamily: family, loading: false }));
        return family;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load family';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async createFamily(data: CreateFamilyRequest) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const family = await api.post<FamilyWithMembers>('/api/families', data);
        update(s => ({
          ...s,
          families: [family, ...s.families],
          currentFamily: family,
          loading: false,
        }));
        return family;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to create family';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async joinFamily(inviteCode: string) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const family = await api.post<FamilyWithMembers>('/api/families/join', { inviteCode });
        update(s => ({
          ...s,
          families: [family, ...s.families],
          currentFamily: family,
          loading: false,
        }));
        return family;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to join family';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async updateFamily(id: string, data: UpdateFamilyRequest) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const family = await api.put<Family>(`/api/families/${id}`, data);
        update(s => ({
          ...s,
          families: s.families.map(f => (f.id === id ? { ...f, ...family } : f)),
          currentFamily: s.currentFamily?.id === id
            ? { ...s.currentFamily, ...family }
            : s.currentFamily,
          loading: false,
        }));
        return family;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to update family';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async deleteFamily(id: string) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        await api.delete(`/api/families/${id}`);
        update(s => ({
          ...s,
          families: s.families.filter(f => f.id !== id),
          currentFamily: s.currentFamily?.id === id ? null : s.currentFamily,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to delete family';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async leaveFamily(familyId: string, userId: string) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        await api.delete(`/api/families/${familyId}/members/${userId}`);
        update(s => ({
          ...s,
          families: s.families.filter(f => f.id !== familyId),
          currentFamily: s.currentFamily?.id === familyId ? null : s.currentFamily,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to leave family';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async regenerateInviteCode(familyId: string) {
      try {
        const result = await api.post<{ inviteCode: string }>(
          `/api/families/${familyId}/invite/regenerate`
        );
        update(s => ({
          ...s,
          families: s.families.map(f =>
            f.id === familyId ? { ...f, inviteCode: result.inviteCode } : f
          ),
          currentFamily: s.currentFamily?.id === familyId
            ? { ...s.currentFamily, inviteCode: result.inviteCode }
            : s.currentFamily,
        }));
        return result.inviteCode;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to regenerate code';
        update(s => ({ ...s, error: message }));
        throw error;
      }
    },

    clearCurrentFamily() {
      update(s => ({ ...s, currentFamily: null }));
    },

    clearError() {
      update(s => ({ ...s, error: null }));
    },
  };
}

export const families = createFamiliesStore();

// Derived stores
export const familiesList = derived(families, ($f) => $f.families);
export const currentFamily = derived(families, ($f) => $f.currentFamily);
export const isFamiliesLoading = derived(families, ($f) => $f.loading);
