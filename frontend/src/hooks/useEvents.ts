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

// Raw shape returned by the backend (Prisma field names) — differs from the
// app-facing EventItem shape, so every fetch goes through toEventItem() below.
interface RawEvent {
  id: string
  title: string
  description: string | null
  eventType: string
  traditionTag: EventItem['tradition']
  startsAt: string
  endsAt: string | null
  locationName: string | null
  onlineUrl: string | null
  organiser: EventItem['organizer']
  association: EventItem['association']
  _count?: { rsvps?: number }
  myRsvp?: string | null
}

function toEventItem(raw: RawEvent): EventItem {
  const mode = raw.onlineUrl && raw.locationName ? 'HYBRID' : raw.onlineUrl ? 'ONLINE' : 'IN_PERSON'
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    type: raw.eventType,
    mode,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    location: raw.locationName,
    onlineUrl: raw.onlineUrl,
    tradition: raw.traditionTag,
    language: null,
    organizer: raw.organiser,
    association: raw.association,
    _count: raw._count ?? {},
    myRsvp: raw.myRsvp ?? null,
    coverUrl: null,
  }
}

async function fetchEvents(filter: EventFilter, token: string | null): Promise<EventItem[]> {
  const params = new URLSearchParams({ limit: '20' })
  if (filter.q) params.set('q', filter.q)
  if (filter.type && filter.type !== 'ALL') params.set('type', filter.type)
  if (filter.mode && filter.mode !== 'ANY') params.set('mode', filter.mode)
  const path = filter.mine ? '/events/mine' : '/events'
  const data = await api.get<ListResponse<RawEvent>>(`${path}?${params}`, token ?? undefined)
  const raw = Array.isArray(data) ? data : (data.data ?? [])
  return raw.map(toEventItem)
}

async function fetchEvent(id: string, token: string | null): Promise<EventItem> {
  const raw = await api.get<RawEvent>(`/events/${id}`, token ?? undefined)
  return toEventItem(raw)
}

export function useEvent(id: string | null) {
  const { token } = useAuthStore()
  return useQuery<EventItem>({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id!, token),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1,
  })
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
