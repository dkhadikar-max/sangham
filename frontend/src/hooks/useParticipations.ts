'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'
import type { UserParticipations } from '@/types'

const EMPTY: UserParticipations = { circles: [], events: [], courses: [], sessions: [] }

async function fetchParticipations(userId: string, token: string | null): Promise<UserParticipations> {
  try {
    const data = await api.get<{ data?: Partial<UserParticipations> } & Partial<UserParticipations>>(
      `/users/${userId}/participations`,
      token ?? undefined,
    )
    const p = data?.data ?? data
    return {
      circles: Array.isArray(p?.circles) ? p.circles : [],
      events: Array.isArray(p?.events) ? p.events : [],
      courses: Array.isArray(p?.courses) ? p.courses : [],
      sessions: Array.isArray(p?.sessions) ? p.sessions : [],
    }
  } catch {
    return EMPTY
  }
}

export function useUserParticipations(userId: string | null) {
  const { token } = useAuthStore()
  return useQuery<UserParticipations>({
    queryKey: ['user-participations', userId],
    queryFn: () => fetchParticipations(userId!, token),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 0,
  })
}
