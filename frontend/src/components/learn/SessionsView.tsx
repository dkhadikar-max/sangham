'use client'

import { useState, useRef, useCallback } from 'react'
import { useSessions, useJoinSession, useLeaveSession, type SessionItem } from '@/hooks/useSessions'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { CreateSessionModal } from '@/components/create/CreateSessionModal'

const MODE_LABELS: Record<string, string> = {
  ONLINE: 'Online', IN_PERSON: 'In-Person', HYBRID: 'Hybrid',
}
const MODE_ICONS: Record<string, string> = {
  ONLINE: 'fa-video', IN_PERSON: 'fa-location-dot', HYBRID: 'fa-arrows-split-up-and-left',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
}

function SessionCard({ session }: { session: SessionItem }) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const join = useJoinSession()
  const leave = useLeaveSession()
  const isPast = new Date(session.startsAt) < new Date()

  function handleJoin() {
    if (!token) { showToast('Sign in to join sessions', 'info'); return }
    if (session.isParticipant) {
      leave.mutate(session.id, { onError: () => showToast('Could not leave session', 'error') })
    } else {
      join.mutate(session.id, { onError: (e) => showToast((e as Error).message || 'Could not join session', 'error') })
    }
  }

  const busy = join.isPending || leave.isPending

  return (
    <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
      {/* Cover / photo */}
      {session.photoUrl ? (
        <img src={session.photoUrl} alt={session.topic} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ height: 6, background: 'linear-gradient(90deg,var(--saffron-400),var(--saffron-600))' }} />
      )}

      <div style={{ padding: 'var(--space-4)' }}>
        {/* Mode badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--saffron-700)', background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
            <i className={`fa-solid ${MODE_ICONS[session.mode] ?? 'fa-calendar'}`} />
            {MODE_LABELS[session.mode] ?? session.mode}
          </span>
          {isPast && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
              Past
            </span>
          )}
        </div>

        {/* Topic */}
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-1)', lineHeight: 1.3 }}>{session.topic}</div>

        {/* Description */}
        {session.description && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {session.description}
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span><i className="fa-regular fa-calendar" style={{ marginRight: 4 }} />{formatDate(session.startsAt)}</span>
          <span><i className="fa-regular fa-clock" style={{ marginRight: 4 }} />{session.durationMinutes} min</span>
          <span><i className="fa-solid fa-users" style={{ marginRight: 4 }} />{session._count.participants}{session.maxParticipants ? ` / ${session.maxParticipants}` : ''}</span>
          {session.language && <span><i className="fa-solid fa-language" style={{ marginRight: 4 }} />{session.language}</span>}
        </div>

        {/* Host */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-sunken)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--saffron-600)' }}>
            {session.host.profilePhoto
              ? <img src={session.host.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : session.host.displayName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Hosted by <strong style={{ color: 'var(--text-primary)' }}>{session.host.displayName}</strong></span>
        </div>

        {/* Action */}
        {!isPast && (
          <button
            className={`btn btn-sm ${session.isParticipant ? 'btn-ghost' : 'btn-primary'}`}
            style={{ width: '100%' }}
            onClick={handleJoin}
            disabled={busy}
          >
            {busy
              ? <><div className="spinner spinner-sm" style={{ marginRight: 6 }} />{session.isParticipant ? 'Leaving…' : 'Joining…'}</>
              : session.isParticipant ? 'Leave session' : 'Join session'}
          </button>
        )}
        {!isPast && session.isParticipant && session.meetingUrl && (
          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 'var(--space-2)', textDecoration: 'none' }}>
            <i className="fa-solid fa-video" style={{ marginRight: 4 }} />Open meeting link
          </a>
        )}
      </div>
    </div>
  )
}

export function SessionsView() {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const [showCreate, setShowCreate] = useState(false)
  const [modeFilter, setModeFilter] = useState('ANY')
  const [showMine, setShowMine] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(val), 400)
  }, [])

  const { data: sessions = [], isLoading, error } = useSessions({
    q: searchQuery || undefined,
    mode: modeFilter !== 'ANY' ? modeFilter : undefined,
    mine: showMine,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Sessions</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>Live study sessions and Dharma talks</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => token ? setShowCreate(true) : showToast('Sign in to schedule a session', 'info')}
        >
          <i className="fa-solid fa-plus" />
          <span>Schedule</span>
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 160 }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search sessions…"
            onChange={e => handleSearch(e.target.value)}
            style={{ paddingLeft: 34, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}
          />
        </div>
        {/* Mode */}
        <select className="input" value={modeFilter} onChange={e => setModeFilter(e.target.value)} style={{ flex: '0 0 auto', width: 'auto', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          <option value="ANY">All formats</option>
          <option value="ONLINE">Online</option>
          <option value="IN_PERSON">In-Person</option>
          <option value="HYBRID">Hybrid</option>
        </select>
        {/* Mine toggle */}
        {token && (
          <button
            className={`chip-toggle${showMine ? ' active' : ''}`}
            onClick={() => setShowMine(v => !v)}
          >
            My sessions
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-4) var(--space-8)' }}>
        {isLoading && (
          <div className="spinner-center"><div className="spinner" /></div>
        )}
        {!isLoading && error && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-tertiary)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 32, display: 'block', marginBottom: 'var(--space-3)', opacity: .5 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Could not load sessions</p>
          </div>
        )}
        {!isLoading && !error && sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-tertiary)' }}>
            <i className="fa-regular fa-calendar-xmark" style={{ fontSize: 40, display: 'block', marginBottom: 'var(--space-3)', opacity: .4 }} />
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No sessions found</p>
            <p style={{ fontSize: 'var(--text-xs)' }}>Be the first to schedule one</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => token ? setShowCreate(true) : showToast('Sign in to schedule a session', 'info')}>
              <i className="fa-solid fa-plus" /> Schedule a session
            </button>
          </div>
        )}
        {sessions.map(s => <SessionCard key={s.id} session={s} />)}
      </div>

      {showCreate && (
        <CreateSessionModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
