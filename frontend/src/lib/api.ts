'use client';

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig
} from 'axios';
import { useAuthStore } from '@/store/auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

/**
 * Central Axios instance.
 * - Attaches the JWT access token on every request.
 * - On a 401, transparently refreshes the token once and replays the request.
 * - Coalesces concurrent refreshes so we only hit /auth/refresh a single time.
 */
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // We use bearer tokens (not cookies), so CSRF is not applicable to the API;
  // withCredentials stays false to avoid leaking ambient cookies cross-site.
  withCredentials: false
});

// ---- request interceptor: attach bearer token ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- response interceptor: single-flight refresh on 401 ----
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    // Use a bare axios call to avoid recursive interceptors.
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken
    });
    setSession(data);
    return data.accessToken as string;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const status = error.response?.status;

    if (status === 401 && original && !original._retried) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Pull a human-friendly message out of an Axios error (ProblemDetails or {error}). */
export function apiError(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; detail?: string; title?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.length) return first[0];
    }
    return data?.error ?? data?.detail ?? data?.title ?? err.message ?? fallback;
  }
  return fallback;
}
