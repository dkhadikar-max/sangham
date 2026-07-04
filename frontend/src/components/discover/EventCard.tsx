'use client'

import { useState } from 'react'
import type { EventItem } from '@/types'
import { useRsvpEvent } from '@/hooks/useEvents'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

interface Props {
  event: EventItem
  onOpen: (id: string) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const typeColors: Record<string, string> = {
  RETREAT: '#7c3aed',
  CEREMONY: '#c026d3',
  TALK: '#0369a1',
  SEMINAR: '#0f766e',
  PROTEST_MARCH: '#b91c1c',
  COMMUNITY_GATHERING: '#b45309',
  DHAMMA_DIKSHA: '#9333ea',
  CONVERSION_CEREMONY: '#9333ea',
  AMBEDKAR_JAYANTI: '#1d4ed8',
}

export function EventCard({ event, onOpen }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const rsvp = useRsvpEvent()
  const [going, setGoing] = useState(event.myRsvp === 'GOING')

  const handleRsvp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) { showToast('Sign in to RSVP', 'info'); return }
    const newStatus = going ? 'CANCELLED' : 'GOING'
    rsvp.mutate({ eventId: event.id, status: newStatus }, {
      onSuccess: () => { setGoing(!going); showToast(going ? 'RSVP cancelled' : 'You\'re going!', 'success') },
      onError: (err) => showToast((err as Error).message, 'error'),
    })
  }

  const typeColor = typeColors[event.type] ?? 'var(--saffron-800)'
  const modeLabel = event.mode === 'ONLINE' ? 'Online' : event.mode === 'IN_PERSON' ? 'In Person' : 'Hybrid'
  const loc = event.mode === 'ONLINE' ? 'Online' : (event.location ?? 'Location TBD')

  return (
    <div className="event-card" onClick={() => onOpen(event.id)}>
      <div className="event-card-type" style={{ color: typeColor }}>
        {event.type.replace(/_/g, ' ')}
        <span className="event-card-mode" style={{ marginLeft: 'var(--space-2)', display:'inline-block' }}>{modeLabel}</span>
      </div>
      <div className="event-card-title">{event.title}</div>
      <div className="event-card-meta">
        <span><i className="fa-regular fa-calendar" style={{ marginRight: 4 }} />{formatDate(event.startsAt)}</span>
        <span><i className="fa-regular fa-clock" style={{ marginRight: 4 }} />{formatTime(event.startsAt)}</span>
        <span><i className="fa-solid fa-location-dot" style={{ marginRight: 4 }} />{loc}</span>
        <span><i className="fa-solid fa-users" style={{ marginRight: 4 }} />{event._count?.rsvps ?? event._count?.attendees ?? 0} going</span>
      </div>
      <div className="event-card-actions">
        <button
          className={`event-rsvp-btn${going ? ' going' : ''}`}
          onClick={handleRsvp}
          disabled={rsvp.isPending}
        >
          {going ? 'Going' : 'RSVP'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); onOpen(event.id) }}
        >
          Details
        </button>
      </div>
    </div>
  )
}
