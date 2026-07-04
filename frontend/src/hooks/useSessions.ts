'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

// Matches backend liveSession model
export interface SessionItem {
  id: string
  title: string
  description: string | null
  sessionType: 'DHARMA_TALK' | 'GUIDED_MEDITATION' | 'SUTTA_STUDY' | 'QA' | 'CEREMONY' | 'TELECAST'
  traditionTag: string | null
  language: string
  scheduledAt: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  maxViewers: number
  rsvpRequired: boolean
  hostId: string
  host: { id: string; displayName: string; profilePhoto: string | null; isVerifiedClergy: boolean }
  _count: { attendees: number }
}

export interface SessionFilter {
  type?: string
}

async function fetchSessions(filter: SessionFilter, token: string | null): Promise<SessionItem[]> {
  const params = new URLSearchParams()
  if (filter.type) params.set('type', filter.type)
  const data = await api.get<SessionItem[] | { data: SessionItem[] }>(`/sessions?${params}`, token ?? undefined)
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
    mutationFn: (sessionId: string) => api.post(`/sessions/${sessionId}/join`, {}, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
