'use client'

import { useState } from 'react'
import type { EventItem } from '@/types'
import { useRsvpEvent } from '@/hooks/useEvents'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

interface Props {
  event: EventItem
  onClose: () => void
  onOpenProfile: (id: string) => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
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

export function EventDetailPanel({ event, onClose, onOpenProfile }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const rsvp = useRsvpEvent()
  const [going, setGoing] = useState(event.myRsvp === 'GOING')

  function handleRsvp() {
    if (!token) { showToast('Sign in to RSVP', 'info'); return }
    const newStatus = going ? 'CANCELLED' : 'GOING'
    rsvp.mutate({ eventId: event.id, status: newStatus }, {
      onSuccess: () => { setGoing(!going); showToast(going ? 'RSVP cancelled' : 'You\'re going!', 'success') },
      onError: (e) => showToast((e as Error).message, 'error'),
    })
  }

  const typeColor = typeColors[event.type] ?? '#C79A3B'
  const modeLabel = event.mode === 'ONLINE' ? 'Online' : event.mode === 'IN_PERSON' ? 'In Person' : 'Hybrid'
  const loc = event.mode === 'ONLINE' ? 'Online' : (event.location ?? 'Location TBD')

  return (
    <div className="panel-comm" style={{ zIndex: 55 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Event Details</span>
      </div>

      <div className="panel-content">
        {/* Cover/hero area */}
        {event.coverUrl ? (
          <img src={event.coverUrl} alt={event.title} style={{ width:'100%', height:180, objectFit:'cover', flexShrink:0 }} />
        ) : (
          <div style={{ width:'100%', height:120, background:`linear-gradient(135deg,${typeColor}33,${typeColor}66)`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fa-solid fa-calendar-days" style={{ fontSize:48, color: typeColor, opacity:.5 }} />
          </div>
        )}

        <div style={{ padding:'var(--space-4)' }}>
          <div className="event-card-type" style={{ color: typeColor, marginBottom:'var(--space-1)' }}>
            {event.type.replace(/_/g,' ')} · {modeLabel}
          </div>
          <h2 style={{ fontSize:'var(--text-xl)', fontWeight:700, color:'var(--text-primary)', lineHeight:1.3, marginBottom:'var(--space-3)' }}>
            {event.title}
          </h2>

          {/* Meta rows */}
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)', marginBottom:'var(--space-4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', fontSize:'var(--text-sm)', color:'var(--text-secondary)' }}>
              <i className="fa-regular fa-calendar" style={{ width:18, color:'var(--saffron-500)' }} />
              <span>{formatDateTime(event.startsAt)}</span>
            </div>
            {event.endsAt && (
              <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', fontSize:'var(--text-sm)', color:'var(--text-secondary)' }}>
                <i className="fa-regular fa-clock" style={{ width:18, color:'var(--saffron-500)' }} />
                <span>Ends {formatDateTime(event.endsAt)}</span>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', fontSize:'var(--text-sm)', color:'var(--text-secondary)' }}>
              <i className="fa-solid fa-location-dot" style={{ width:18, color:'var(--saffron-500)' }} />
              <span>
                {loc}
                {event.mode === 'ONLINE' && event.onlineUrl && (
                  <> · <span style={{ color:'var(--saffron-800)' }}>Join link available after RSVP</span></>
                )}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', fontSize:'var(--text-sm)', color:'var(--text-secondary)' }}>
              <i className="fa-solid fa-users" style={{ width:18, color:'var(--saffron-500)' }} />
              <span>{event._count?.rsvps ?? event._count?.attendees ?? 0} going</span>
            </div>
          </div>

          {/* RSVP button */}
          <button
            className={`btn ${going ? 'btn-ghost' : 'btn-primary'}`}
            style={{ width:'100%', marginBottom:'var(--space-4)' }}
            onClick={handleRsvp}
            disabled={rsvp.isPending}
          >
            {going ? 'Cancel RSVP' : 'RSVP — I\'m Going'}
          </button>

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom:'var(--space-4)' }}>
              <div className="section-title" style={{ padding:0, marginBottom:'var(--space-2)' }}>About this Event</div>
              <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)', lineHeight:1.6 }}>{event.description}</p>
            </div>
          )}

          {/* Organizer */}
          <div>
            <div className="section-title" style={{ padding:0, marginBottom:'var(--space-3)' }}>Organizer</div>
            <button
              style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit', textAlign:'left', width:'100%' }}
              onClick={() => onOpenProfile(event.organizer.id)}
            >
              <div className="avatar avatar-md">
                {event.organizer.profilePhoto
                  ? <img src={event.organizer.profilePhoto} alt={event.organizer.displayName} />
                  : <span>{event.organizer.displayName.slice(0,2).toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-primary)' }}>{event.organizer.displayName}</div>
                {event.association && (
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)' }}>{event.association.name}</div>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
