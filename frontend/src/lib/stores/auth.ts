import { writable, derived } from 'svelte/store';
import { api, ApiError } from '$lib/api/client';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '$lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: false,
    initialized: false,
    error: null,
  });

  return {
    subscribe,

    async init() {
      if (!api.isAuthenticated()) {
        update(s => ({ ...s, initialized: true }));
        return;
      }

      update(s => ({ ...s, loading: true }));

      try {
        const user = await api.get<User>('/api/auth/me');
        update(s => ({ ...s, user, loading: false, initialized: true }));
      } catch (error) {
        api.clearTokens();
        update(s => ({ ...s, user: null, loading: false, initialized: true }));
      }
    },

    async login(credentials: LoginRequest) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const response = await api.post<AuthResponse>('/api/auth/login', credentials, {
          skipAuth: true,
        });
        api.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
        update(s => ({ ...s, user: response.user, loading: false }));
        return response.user;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Login failed';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async register(data: RegisterRequest) {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const response = await api.post<AuthResponse>('/api/auth/register', data, {
          skipAuth: true,
        });
        api.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
        update(s => ({ ...s, user: response.user, loading: false }));
        return response.user;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Registration failed';
        update(s => ({ ...s, loading: false, error: message }));
        throw error;
      }
    },

    async logout() {
      try {
        await api.post('/api/auth/logout', {
          refreshToken: localStorage.getItem('refreshToken'),
        });
      } catch {
        // Ignore logout errors
      } finally {
        api.clearTokens();
        set({ user: null, loading: false, initialized: true, error: null });
      }
    },

    clearError() {
      update(s => ({ ...s, error: null }));
    },
  };
}

export const auth = createAuthStore();

// Derived stores for convenience
export const user = derived(auth, ($auth) => $auth.user);
export const isAuthenticated = derived(auth, ($auth) => !!$auth.user);
export const isAuthLoading = derived(auth, ($auth) => $auth.loading);
