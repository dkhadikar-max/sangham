'use client'

import { useFollowers, useFollowingList, type ConnectionListItem } from '@/hooks/useProfile'
import { useUiStore } from '@/stores/ui'

interface Props {
  kind: 'followers' | 'following'
  onClose: () => void
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function ConnectionRow({ person, badge, onOpenProfile }: { person: ConnectionListItem; badge?: string; onOpenProfile: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpenProfile(person.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
    >
      <div className="avatar-sm">
        {person.profilePhoto
          ? <img src={person.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : initials(person.displayName)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{person.displayName}</span>
          {(person.isVerifiedClergy || person.isVerifiedTeacher) && (
            <i className="fa-solid fa-circle-check" style={{ fontSize: 11, color: 'var(--saffron-600)' }} />
          )}
        </div>
        {person.bio && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.bio}</div>
        )}
      </div>
      {badge && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'var(--surface-bg)', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>{badge}</span>
      )}
    </button>
  )
}

export function ConnectionsListPanel({ kind, onClose }: Props) {
  const followers = useFollowers()
  const followingList = useFollowingList()
  const { data, isLoading } = kind === 'followers' ? followers : followingList
  const { viewProfile } = useUiStore()

  function handleOpenProfile(id: string) {
    onClose()
    viewProfile(id)
  }

  return (
    <div className="panel-comm" style={{ zIndex: 56 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">{kind === 'followers' ? 'Followers' : 'Following'}</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        )}

        {data && data.length === 0 && (
          <p style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            {kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
          </p>
        )}

        {data && data.map((person) => (
          <ConnectionRow
            key={person.id}
            person={person}
            badge={kind === 'followers' ? (person.isFollowingBack ? 'Following' : undefined) : (person.followsBack ? 'Follows you' : undefined)}
            onOpenProfile={handleOpenProfile}
          />
        ))}
      </div>
    </div>
  )
}
