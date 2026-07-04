'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'
import type { EventItem } from '@/types'

type ListResponse<T> = T[] | { data?: T[] }

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
  const path = filter.mine ? '/events/mine' : '/events'
  const data = await api.get<ListResponse<EventItem>>(`${path}?${params}`, token ?? undefined)
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
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      api.post(`/events/${eventId}/rsvp`, { status }, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}
