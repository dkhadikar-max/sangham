'use client'

import { useState } from 'react'
import { useSessions, useJoinSession, type SessionItem } from '@/hooks/useSessions'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const TYPE_LABELS: Record<string, string> = {
  DHARMA_TALK: 'Dharma Talk',
  GUIDED_MEDITATION: 'Guided Meditation',
  SUTTA_STUDY: 'Sutta Study',
  QA: 'Q&A',
  CEREMONY: 'Ceremony',
  TELECAST: 'Telecast',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
}

function SessionCard({ session }: { session: SessionItem }) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const join = useJoinSession()
  const isPast = new Date(session.scheduledAt) < new Date()
  const isLive = session.status === 'LIVE'

  function handleRegister() {
    if (!token) { showToast('Sign in to register for sessions', 'info'); return }
    join.mutate(session.id, {
      onSuccess: () => showToast('Registered for session!', 'success'),
      onError: () => showToast('Could not register for session', 'error'),
    })
  }

  return (
    <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
      <div style={{ height: 6, background: isLive ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,var(--saffron-400),var(--saffron-600))' }} />

      <div style={{ padding: 'var(--space-4)' }}>
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--saffron-700)', background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
            <i className="fa-solid fa-dharmachakra" />
            {TYPE_LABELS[session.sessionType] ?? session.sessionType}
          </span>
          {isLive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: '#ef4444', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
              <i className="fa-solid fa-circle" style={{ fontSize: 6 }} />LIVE
            </span>
          )}
          {isPast && !isLive && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
              Ended
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-1)', lineHeight: 1.3 }}>{session.title}</div>

        {/* Description */}
        {session.description && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {session.description}
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span><i className="fa-regular fa-calendar" style={{ marginRight: 4 }} />{formatDate(session.scheduledAt)}</span>
          <span><i className="fa-solid fa-users" style={{ marginRight: 4 }} />{session._count.attendees} attending</span>
          {session.language && <span><i className="fa-solid fa-language" style={{ marginRight: 4 }} />{session.language.toUpperCase()}</span>}
          {session.maxViewers > 0 && <span>Max {session.maxViewers}</span>}
        </div>

        {/* Host */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-sunken)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--saffron-600)' }}>
            {session.host.profilePhoto
              ? <img src={session.host.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : session.host.displayName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Hosted by <strong style={{ color: 'var(--text-primary)' }}>{session.host.displayName}</strong>
            {session.host.isVerifiedClergy && <i className="fa-solid fa-circle-check ml-1 text-xs" style={{ color: '#C79A3B' }} title="Verified teacher" />}
          </span>
        </div>

        {/* Register button */}
        {!isPast && (
          <button
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
            onClick={handleRegister}
            disabled={join.isPending}
          >
            {join.isPending
              ? <><div className="spinner spinner-sm" style={{ marginRight: 6 }} />Registering…</>
              : isLive ? 'Join Live Session' : 'Register'}
          </button>
        )}
      </div>
    </div>
  )
}

export function SessionsView() {
  const { showToast } = useUiStore()
  const [typeFilter, setTypeFilter] = useState('')

  const { data: sessions = [], isLoading, error } = useSessions({
    type: typeFilter || undefined,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Live Sessions</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>Dharma talks, guided meditation, and live teachings</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => showToast('Live session hosting requires platform setup — coming soon', 'info')}
        >
          <i className="fa-solid fa-broadcast-tower" />
          <span>Host</span>
        </button>
      </div>

      {/* Filter */}
      <div style={{ padding: '0 var(--space-4) var(--space-3)', flexShrink: 0 }}>
        <select
          className="input"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer', width: 'auto', minWidth: 180 }}
        >
          <option value="">All session types</option>
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
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
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No upcoming sessions</p>
            <p style={{ fontSize: 'var(--text-xs)' }}>Check back soon for live Dharma sessions</p>
          </div>
        )}
        {sessions.map(s => <SessionCard key={s.id} session={s} />)}
      </div>
    </div>
  )
}
