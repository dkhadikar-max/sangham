'use client'

import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, type AppNotification } from '@/hooks/useNotifications'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

interface Props {
  onClose: () => void
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const TYPE_ICONS: Record<string, string> = {
  follow: 'fa-user-plus',
  like: 'fa-heart',
  comment: 'fa-comment',
  session_reminder: 'fa-video',
  event_reminder: 'fa-calendar-days',
  event_rsvp: 'fa-calendar-check',
  project_join: 'fa-diagram-project',
  new_message: 'fa-message',
}

function NotificationRow({ n, onRead, onNavigate }: { n: AppNotification; onRead: (id: string) => void; onNavigate: (n: AppNotification) => void }) {
  return (
    <button
      onClick={() => {
        if (!n.isRead) onRead(n.id)
        onNavigate(n)
      }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', width: '100%',
        background: n.isRead ? 'none' : 'var(--saffron-50)', border: 'none',
        borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-3) var(--space-4)',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--saffron-100)', color: 'var(--saffron-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`fa-solid ${TYPE_ICONS[n.type] ?? 'fa-bell'}`} style={{ fontSize: 14 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: n.isRead ? 500 : 700, color: 'var(--text-primary)' }}>{n.title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{n.body}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
      </div>
      {!n.isRead && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--saffron-600)', flexShrink: 0, marginTop: 6 }} />
      )}
    </button>
  )
}

export function NotificationsPanel({ onClose }: Props) {
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const { user } = useAuthStore()
  const { viewProfile, viewEvent, viewProject, openConversation } = useUiStore()

  function handleNavigate(n: AppNotification) {
    const target = n.data as Record<string, string> | null
    if (!target) return
    switch (n.type) {
      case 'follow':
        if (target.userId) { viewProfile(target.userId); onClose() }
        break
      case 'event_rsvp':
        if (target.eventId) { viewEvent(target.eventId); onClose() }
        break
      case 'project_join':
        if (target.projectId) { viewProject(target.projectId); onClose() }
        break
      case 'new_message':
        if (target.userId && user) {
          openConversation([user.id, target.userId].sort().join('+'))
          onClose()
        }
        break
    }
  }

  return (
    <div className="panel-comm" style={{ zIndex: 50 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Notifications</span>
        {!!data?.unreadCount && (
          <button className="btn btn-ghost btn-sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all read
          </button>
        )}
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        )}

        {data && data.data.length === 0 && (
          <p style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            No notifications yet.
          </p>
        )}

        {data && data.data.map((n) => (
          <NotificationRow key={n.id} n={n} onRead={(id) => markRead.mutate(id)} onNavigate={handleNavigate} />
        ))}
      </div>
    </div>
  )
}
