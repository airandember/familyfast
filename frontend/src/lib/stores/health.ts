import { writable, derived } from 'svelte/store';
import { api } from '$lib/api/client';
import type {
  WeightLog,
  FoodLog,
  WeightTrend,
  DailySummary,
  CreateWeightLogRequest,
  CreateFoodLogRequest,
} from '$lib/types';

interface HealthState {
  weightLogs: WeightLog[];
  weightTrend: WeightTrend[];
  foodLogs: FoodLog[];
  dailySummary: DailySummary | null;
  loading: boolean;
  error: string | null;
}

function createHealthStore() {
  const { subscribe, set, update } = writable<HealthState>({
    weightLogs: [],
    weightTrend: [],
    foodLogs: [],
    dailySummary: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    // ============================================
    // Weight Tracking
    // ============================================

    async logWeight(input: CreateWeightLogRequest) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.post<{ data: WeightLog }>(
          '/api/health/weight',
          input
        );
        update((s) => {
          // Update or add log
          const existingIndex = s.weightLogs.findIndex((l) => l.date === response.data.date);
          const newLogs =
            existingIndex >= 0
              ? s.weightLogs.map((l, i) => (i === existingIndex ? response.data : l))
              : [response.data, ...s.weightLogs];
          return { ...s, weightLogs: newLogs, loading: false };
        });
        return response.data;
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to log weight',
        }));
        return null;
      }
    },

    async loadWeightLogs(days: number = 30) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.get<{ data: WeightLog[] }>(
          `/api/health/weight?days=${days}`
        );
        update((s) => ({ ...s, weightLogs: response.data, loading: false }));
        return response.data;
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to load weight logs',
        }));
        return [];
      }
    },

    async loadWeightTrend(days: number = 30) {
      try {
        const response = await api.get<{ data: WeightTrend[] }>(
          `/api/health/weight/trend?days=${days}`
        );
        update((s) => ({ ...s, weightTrend: response.data }));
        return response.data;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to load weight trend' }));
        return [];
      }
    },

    async deleteWeightLog(date: string) {
      try {
        await api.delete(`/api/health/weight/${date}`);
        update((s) => ({
          ...s,
          weightLogs: s.weightLogs.filter((l) => l.date !== date),
        }));
        return true;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to delete weight log' }));
        return false;
      }
    },

    // ============================================
    // Food Logging
    // ============================================

    async logFood(input: CreateFoodLogRequest) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.post<{ data: FoodLog }>(
          '/api/health/food',
          input
        );
        update((s) => ({
          ...s,
          foodLogs: [response.data, ...s.foodLogs],
          loading: false,
        }));
        return response.data;
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to log food',
        }));
        return null;
      }
    },

    async loadFoodLogs(date?: string, challengeLogId?: string) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        if (challengeLogId) params.set('challengeLogId', challengeLogId);
        const url = `/api/health/food${params.toString() ? '?' + params.toString() : ''}`;
        const response = await api.get<{ data: FoodLog[] }>(url);
        update((s) => ({ ...s, foodLogs: response.data, loading: false }));
        return response.data;
      } catch (error: any) {
        update((s) => ({
          ...s,
          loading: false,
          error: error.message || 'Failed to load food logs',
        }));
        return [];
      }
    },

    async deleteFoodLog(foodLogId: string) {
      try {
        await api.delete(`/api/health/food/${foodLogId}`);
        update((s) => ({
          ...s,
          foodLogs: s.foodLogs.filter((l) => l.id !== foodLogId),
        }));
        return true;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to delete food log' }));
        return false;
      }
    },

    async loadDailySummary(date: string) {
      try {
        const response = await api.get<{ data: DailySummary }>(
          `/api/health/food/summary/${date}`
        );
        update((s) => ({ ...s, dailySummary: response.data }));
        return response.data;
      } catch (error: any) {
        update((s) => ({ ...s, error: error.message || 'Failed to load daily summary' }));
        return null;
      }
    },

    // ============================================
    // Helpers
    // ============================================

    clearError() {
      update((s) => ({ ...s, error: null }));
    },

    reset() {
      set({
        weightLogs: [],
        weightTrend: [],
        foodLogs: [],
        dailySummary: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const healthStore = createHealthStore();

// Derived stores for quick stats
export const latestWeight = derived(healthStore, ($store) =>
  $store.weightLogs.length > 0 ? $store.weightLogs[0] : null
);

export const weightChange = derived(healthStore, ($store) => {
  if ($store.weightTrend.length < 2) return null;
  const first = $store.weightTrend[0];
  const last = $store.weightTrend[$store.weightTrend.length - 1];
  return {
    change: last.weight - first.weight,
    startWeight: first.weight,
    endWeight: last.weight,
    days: $store.weightTrend.length,
  };
});

export const todayMacros = derived(healthStore, ($store) => {
  if (!$store.dailySummary) return null;
  return $store.dailySummary;
});
