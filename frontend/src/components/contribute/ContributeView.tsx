'use client'

import { useContributionLeaderboard, type ContributionLeader } from '@/hooks/useContributions'
import { useUiStore } from '@/stores/ui'

interface Props {
  onClose: () => void
}

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function LeaderRow({ leader, rank }: { leader: ContributionLeader; rank: number }) {
  const { viewProfile } = useUiStore()
  return (
    <button
      onClick={() => viewProfile(leader.user.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
    >
      <div style={{ width: 24, fontSize: 'var(--text-sm)', fontWeight: 700, color: rank <= 3 ? 'var(--saffron-700)' : 'var(--text-tertiary)', flexShrink: 0, textAlign: 'center' }}>
        {rank}
      </div>
      <div className="avatar-sm" style={{ flexShrink: 0 }}>
        {leader.user.profilePhoto
          ? <img src={leader.user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : initials(leader.user.displayName)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {leader.user.displayName}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {leader.eventsHosted} events · {leader.sessionsHosted} sessions
        </div>
      </div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--saffron-700)', flexShrink: 0 }}>
        {leader.totalScore}
      </div>
    </button>
  )
}

export function ContributeView({ onClose }: Props) {
  const { data: leaders, isLoading } = useContributionLeaderboard()

  return (
    <div className="panel-comm" style={{ zIndex: 50 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Contribute</span>
      </div>

      <div className="panel-content">
        <div style={{ background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 10, padding: '12px 14px', margin: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--saffron-700)' }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 8 }} />
          Contribution scores reward service to the community — hosting events and sessions, sharing resources, teaching courses, and answering questions helpfully. Not follower counts.
        </div>

        <div className="section-title" style={{ padding: '0 var(--space-4)', marginBottom: 'var(--space-2)' }}>Top Contributors</div>

        {isLoading && (
          <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        )}

        {leaders && leaders.length === 0 && (
          <p style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            No contributions recorded yet.
          </p>
        )}

        {leaders?.map((leader, i) => (
          <LeaderRow key={leader.user.id} leader={leader} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
