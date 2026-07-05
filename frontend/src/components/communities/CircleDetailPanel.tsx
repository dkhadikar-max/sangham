'use client'

import { useCircleDetail, useJoinCircle, useLeaveCircle, useSetCircleStatus } from '@/hooks/useCircleDetail'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { DiscussionThread } from '@/components/discussion/DiscussionThread'

interface Props {
  circleId: string
  onClose: () => void
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function CircleDetailPanel({ circleId, onClose }: Props) {
  const { token, user } = useAuthStore()
  const { showToast, viewProfile } = useUiStore()
  const { data: circle, isLoading } = useCircleDetail(circleId)
  const join = useJoinCircle()
  const leave = useLeaveCircle()
  const setStatus = useSetCircleStatus()

  const isFacilitator = !!circle && !!user && circle.facilitator?.id === user.id

  function handleToggleJoin() {
    if (!token) { showToast('Sign in to join study circles', 'info'); return }
    if (!circle) return
    if (circle.isMember) {
      leave.mutate(circleId, { onSuccess: () => showToast('Left study circle', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    } else {
      join.mutate(circleId, { onSuccess: () => showToast('Joined study circle!', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    }
  }

  function handleToggleStatus() {
    if (!circle) return
    const nextStatus = circle.status === 'CLOSED' ? 'OPEN' : 'CLOSED'
    setStatus.mutate({ id: circleId, status: nextStatus }, {
      onSuccess: () => showToast(nextStatus === 'CLOSED' ? 'Circle closed' : 'Circle reopened', 'success'),
      onError: (e) => showToast((e as Error).message || 'Failed to update status', 'error'),
    })
  }

  return (
    <div className="panel-comm" style={{ zIndex: 55 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Study Circle</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        )}

        {circle && (
          <div style={{ padding: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{circle.topic}</h2>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              {circle._count.members} members · {circle.status}
              {circle.scheduleDescription ? ` · ${circle.scheduleDescription}` : ''}
            </div>

            {isFacilitator ? (
              <button
                className={`btn ${circle.status === 'CLOSED' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ width: '100%', marginBottom: 'var(--space-4)' }}
                onClick={handleToggleStatus}
                disabled={setStatus.isPending}
              >
                {circle.status === 'CLOSED' ? 'Reopen Circle' : 'Close Circle'}
              </button>
            ) : (
              <button
                className={`btn ${circle.isMember ? 'btn-ghost' : 'btn-primary'}`}
                style={{ width: '100%', marginBottom: 'var(--space-4)' }}
                onClick={handleToggleJoin}
                disabled={join.isPending || leave.isPending}
              >
                {circle.isMember ? 'Leave Circle' : 'Join Circle'}
              </button>
            )}

            {circle.description && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>{circle.description}</p>
            )}

            {circle.event && (
              <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-bg)', borderRadius: 'var(--radius-lg)' }}>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-1)' }}>Next Session</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{circle.event.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {new Date(circle.event.startsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {circle.facilitator && (
              <>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Facilitator</div>
                <button
                  onClick={() => viewProfile(circle.facilitator!.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 'var(--space-4)' }}
                >
                  <div className="avatar-sm">
                    {circle.facilitator.profilePhoto
                      ? <img src={circle.facilitator.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : initials(circle.facilitator.displayName)}
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>{circle.facilitator.displayName}</span>
                </button>
              </>
            )}

            {circle.members.length > 0 && (
              <>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Members</div>
                {circle.members.map((m) => (
                  <button
                    key={m.user.id}
                    onClick={() => viewProfile(m.user.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-2) 0', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  >
                    <div className="avatar-sm">
                      {m.user.profilePhoto
                        ? <img src={m.user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : initials(m.user.displayName)}
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{m.user.displayName}</span>
                  </button>
                ))}
              </>
            )}

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <DiscussionThread entityType="study-circle" entityId={circleId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
