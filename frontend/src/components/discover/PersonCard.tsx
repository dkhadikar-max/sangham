'use client'

import { useState } from 'react'
import type { DiscoverPerson } from '@/types'
import { useFollowUser, useUnfollowUser } from '@/hooks/useDiscover'
import { useUserParticipations } from '@/hooks/useParticipations'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

interface Props {
  person: DiscoverPerson
  onOpen: (id: string) => void
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function intentLabel(intent: string | null) {
  if (!intent) return null
  const map: Record<string, string> = {
    LEARN: 'Seeking to Learn',
    TEACH: 'Open to Teaching',
    CONNECT: 'Seeking Connection',
    COLLABORATE: 'Seeking Collaboration',
    VOLUNTEER: 'Seeking to Volunteer',
  }
  return map[intent] ?? intent
}

export function PersonCard({ person, onOpen }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const follow = useFollowUser()
  const unfollow = useUnfollowUser()
  const [following, setFollowing] = useState(person.isFollowing ?? false)

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) { showToast('Sign in to follow people', 'info'); return }
    if (following) {
      unfollow.mutate(person.id, {
        onSuccess: () => { setFollowing(false) },
        onError: (err) => showToast((err as Error).message, 'error'),
      })
    } else {
      follow.mutate(person.id, {
        onSuccess: () => { setFollowing(true) },
        onError: (err) => showToast((err as Error).message, 'error'),
      })
    }
  }

  const { data: participations } = useUserParticipations(person.id)
  const intentText = intentLabel(person.seekingIntent)
  const loc = [person.city, person.country].filter(Boolean).join(', ')
  const langs = person.languages?.slice(0, 3).join(', ')
  const isPending = follow.isPending || unfollow.isPending

  const partParts = participations ? [
    participations.circles.length > 0 && `${participations.circles.length} circle${participations.circles.length > 1 ? 's' : ''}`,
    participations.events.filter(e => new Date(e.startsAt) > new Date()).length > 0 && `${participations.events.filter(e => new Date(e.startsAt) > new Date()).length} event${participations.events.filter(e => new Date(e.startsAt) > new Date()).length > 1 ? 's' : ''}`,
    participations.courses.length > 0 && `${participations.courses.length} course${participations.courses.length > 1 ? 's' : ''}`,
    participations.sessions.length > 0 && `${participations.sessions.length} session${participations.sessions.length > 1 ? 's' : ''}`,
  ].filter(Boolean).join(' · ') : ''

  return (
    <div className="person-card">
      {/* Avatar */}
      <div
        className="avatar avatar-lg flex-shrink-0 cursor-pointer"
        onClick={() => onOpen(person.id)}
        style={{ border: '2px solid var(--saffron-200)' }}
      >
        {person.profilePhoto
          ? <img src={person.profilePhoto} alt={person.displayName} />
          : <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--saffron-800)' }}>{initials(person.displayName)}</span>}
      </div>

      {/* Info */}
      <button className="person-info" onClick={() => onOpen(person.id)}>
        <div className="person-name">
          {person.displayName}
          {person.isVerifiedTeacher && (
            <span className="badge-verified-teacher" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:16, height:16, borderRadius:'50%' }}>
              <i className="fa-solid fa-check" style={{ fontSize:9, color:'white' }} />
            </span>
          )}
        </div>
        <div className="person-meta">
          {person.tradition && <span>{person.tradition.charAt(0) + person.tradition.slice(1).toLowerCase()}</span>}
          {loc && <span><i className="fa-solid fa-location-dot" style={{ fontSize:10 }} /> {loc}</span>}
          {intentText && <span style={{ color: 'var(--saffron-800)', fontWeight: 500 }}>{intentText}</span>}
        </div>
        {langs && <div className="person-langs">{langs}</div>}
        {partParts && <div style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', marginTop:2 }}>{partParts}</div>}
      </button>

      {/* Actions */}
      <div className="person-actions">
        <button
          className={`btn btn-sm${following ? ' connected' : ' btn-primary'}`}
          onClick={handleFollow}
          disabled={isPending}
        >
          {following ? 'Connected' : 'Connect'}
        </button>
      </div>
    </div>
  )
}
