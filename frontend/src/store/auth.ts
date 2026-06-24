'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@/types';

interface AuthState {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  roles: string[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setSession: (auth: AuthResponse) => void;
  clear: () => void;
}

const STAFF_ROLES = ['admin', 'support', 'catalog'];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      fullName: null,
      roles: [],
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      setSession: (auth) =>
        set({
          userId: auth.userId,
          email: auth.email,
          fullName: auth.fullName,
          roles: auth.roles,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          isAuthenticated: true,
          isAdmin: auth.roles.some((r) => STAFF_ROLES.includes(r))
        }),
      clear: () =>
        set({
          userId: null,
          email: null,
          fullName: null,
          roles: [],
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false
        })
    }),
    {
      name: 'drip-auth',
      // Persist only what we need to rehydrate a session.
      partialize: (s) => ({
        userId: s.userId,
        email: s.email,
        fullName: s.fullName,
        roles: s.roles,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
        isAdmin: s.isAdmin
      })
    }
  )
);
