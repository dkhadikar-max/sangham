'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import type { EventItem } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface EventFilter {
  q?: string
  type?: string
  mode?: string
  mine?: boolean
}

async function fetchEvents(filter: EventFilter, token: string | null): Promise<EventItem[]> {
  const params = new URLSearchParams({ limit: '20' })
  if (filter.q) params.set('q', filter.q)
  if (filter.type && filter.type !== 'ALL') params.set('type', filter.type)
  if (filter.mode && filter.mode !== 'ANY') params.set('mode', filter.mode)
  const endpoint = filter.mine ? `${API}/events/mine` : `${API}/events`
  const res = await fetch(`${endpoint}?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to load events')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export function useEvents(filter: EventFilter) {
  const { token } = useAuthStore()
  return useQuery<EventItem[]>({
    queryKey: ['events', filter],
    queryFn: () => fetchEvents(filter, token),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useRsvpEvent() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const res = await fetch(`${API}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to RSVP')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}
