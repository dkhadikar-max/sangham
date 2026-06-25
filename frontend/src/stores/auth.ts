import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  setAuth: (user: User, token: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (partial: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,

      setAuth(user, token, refreshToken) {
        set({ user, token, refreshToken })
      },

      clearAuth() {
        set({ user: null, token: null, refreshToken: null })
      },

      updateUser(partial) {
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null }))
      },
    }),
    {
      name: 'sangham-auth',
      partialize: (s) => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }),
    },
  ),
)
