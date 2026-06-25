'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import type { UserParticipations } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const EMPTY: UserParticipations = { circles: [], events: [], courses: [], sessions: [] }

async function fetchParticipations(userId: string, token: string | null): Promise<UserParticipations> {
  try {
    const res = await fetch(`${API}/users/${userId}/participations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return EMPTY
    const data = await res.json()
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
