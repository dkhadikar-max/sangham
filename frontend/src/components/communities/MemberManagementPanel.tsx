'use client'

import { useState } from 'react'
import { useAssociation, useSetMemberRole, useRemoveMember } from '@/hooks/useCommunities'
import { useUiStore } from '@/stores/ui'

interface Props {
  assocId: string
  onClose: () => void
}

const ROLES = ['MEMBER', 'CORE', 'SECRETARY', 'TREASURER']

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function MemberManagementPanel({ assocId, onClose }: Props) {
  const { showToast, viewProfile } = useUiStore()
  const { data: assoc, isLoading } = useAssociation(assocId)
  const setRole = useSetMemberRole()
  const removeMember = useRemoveMember()
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null)

  function handleRoleChange(userId: string, memberRole: string) {
    setRole.mutate({ assocId, userId, memberRole }, {
      onSuccess: () => showToast('Role updated', 'success'),
      onError: (e) => showToast((e as Error).message || 'Failed to update role', 'error'),
    })
  }

  function handleRemove(userId: string) {
    if (confirmingRemove !== userId) {
      setConfirmingRemove(userId)
      setTimeout(() => setConfirmingRemove((cur) => (cur === userId ? null : cur)), 4000)
      return
    }
    setConfirmingRemove(null)
    removeMember.mutate({ assocId, userId }, {
      onSuccess: () => showToast('Member removed', 'success'),
      onError: (e) => showToast((e as Error).message || 'Failed to remove member', 'error'),
    })
  }

  return (
    <div className="panel-comm" style={{ zIndex: 55 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Manage Members</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        )}

        {assoc && (
          <div>
            {assoc.members.map((m) => (
              <div
                key={m.user.id}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <button
                  onClick={() => viewProfile(m.user.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                >
                  <div className="avatar-sm" style={{ flexShrink: 0 }}>
                    {m.user.profilePhoto
                      ? <img src={m.user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : initials(m.user.displayName)}
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.user.displayName || 'Unknown'}
                  </span>
                </button>

                {m.memberRole === 'PRESIDENT' ? (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--saffron-700)', fontWeight: 600, flexShrink: 0 }}>President</span>
                ) : (
                  <>
                    <select
                      className="input"
                      value={m.memberRole}
                      onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                      disabled={setRole.isPending}
                      style={{ width: 'auto', flexShrink: 0, fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemove(m.user.id)}
                      disabled={removeMember.isPending}
                      style={{ flexShrink: 0, color: confirmingRemove === m.user.id ? 'var(--error-500)' : undefined }}
                    >
                      {confirmingRemove === m.user.id ? 'Confirm?' : 'Remove'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
