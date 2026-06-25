'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface SessionItem {
  id: string
  topic: string
  description: string | null
  mode: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  startsAt: string
  durationMinutes: number
  language: string
  maxParticipants: number | null
  location: string | null
  meetingUrl: string | null
  photoUrl: string | null
  rules: string | null
  hostId: string
  host: { id: string; displayName: string; profilePhoto: string | null }
  circleId: string | null
  _count: { participants: number }
  isParticipant?: boolean
}

export interface SessionFilter {
  q?: string
  mode?: string
  mine?: boolean
}

async function fetchSessions(filter: SessionFilter, token: string | null): Promise<SessionItem[]> {
  const params = new URLSearchParams({ limit: '20' })
  if (filter.q) params.set('q', filter.q)
  if (filter.mode && filter.mode !== 'ANY') params.set('mode', filter.mode)
  const endpoint = filter.mine ? `${API}/sessions/mine` : `${API}/sessions`
  const res = await fetch(`${endpoint}?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to load sessions')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export function useSessions(filter: SessionFilter = {}) {
  const { token } = useAuthStore()
  return useQuery<SessionItem[]>({
    queryKey: ['sessions', filter],
    queryFn: () => fetchSessions(filter, token),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useJoinSession() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`${API}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to join session')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useLeaveSession() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`${API}/sessions/${sessionId}/join`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to leave session')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
