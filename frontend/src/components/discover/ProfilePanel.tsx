'use client'

import { useState } from 'react'
import type { UserProfile, FeedPost, Tradition } from '@/types'
import { useUserProfile, useUserPosts, useSaveProfile } from '@/hooks/useProfile'
import { useFollowUser, useUnfollowUser } from '@/hooks/useDiscover'
import { useUserParticipations } from '@/hooks/useParticipations'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

interface Props {
  userId: string
  onClose: () => void
}

const TRADITIONS: Tradition[] = ['THERAVADA', 'MAHAYANA', 'VAJRAYANA', 'NAVAYANA', 'ZEN', 'PURE_LAND', 'TIBETAN', 'MULTIPLE', 'OTHER']
const LANGUAGES = ['en', 'hi', 'mr', 'sa', 'te', 'ta', 'pa', 'gu']
const LANG_LABELS: Record<string, string> = { en:'English', hi:'Hindi', mr:'Marathi', sa:'Sanskrit', te:'Telugu', ta:'Tamil', pa:'Punjabi', gu:'Gujarati' }
const INTENTS = ['LEARN','TEACH','CONNECT','COLLABORATE','VOLUNTEER']
const INTENT_LABELS: Record<string, string> = { LEARN:'Seeking to Learn', TEACH:'Open to Teaching', CONNECT:'Seeking Connection', COLLABORATE:'Seeking Collaboration', VOLUNTEER:'Seeking to Volunteer' }
const INTERESTS = ['Meditation','Dharma Study','Social Action','Languages','Art','Music','Cooking','Volunteering','Travel','Writing']

function tradClass(traditions: Tradition[]) {
  if (!traditions || traditions.length === 0) return ''
  if (traditions.length > 1) return 'trad-multiple'
  const t = traditions[0]?.toLowerCase()
  if (t === 'theravada') return 'trad-theravada'
  if (t === 'navayana') return 'trad-navayana'
  if (t === 'mahayana' || t === 'zen' || t === 'pure_land') return 'trad-mahayana'
  if (t === 'vajrayana' || t === 'tibetan') return 'trad-vajrayana'
  return 'trad-other'
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function PostList({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) return <p style={{ padding:'var(--space-4)', color:'var(--text-tertiary)', fontSize:'var(--text-sm)' }}>No posts yet</p>
  return (
    <div>
      {posts.map((p) => (
        <div key={p.id} style={{ padding:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)' }}>
          <p style={{ fontSize:'var(--text-sm)', color:'var(--text-primary)', lineHeight:1.5 }}>{p.content}</p>
          <p style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginTop:'var(--space-2)' }}>
            {new Date(p.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </p>
        </div>
      ))}
    </div>
  )
}

type PanelTab = 'posts' | 'about'

interface EditState {
  displayName: string
  bio: string
  city: string
  country: string
  templeAffiliation: string
  traditions: Tradition[]
  languages: string[]
  seekingIntent: string
  interests: string[]
}

function EditForm({ profile, onSave, onCancel }: { profile: UserProfile; onSave: (d: Partial<UserProfile>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<EditState>({
    displayName: profile.displayName,
    bio: profile.bio ?? '',
    city: profile.city ?? '',
    country: profile.country ?? '',
    templeAffiliation: profile.templeAffiliation ?? '',
    traditions: profile.traditions ?? (profile.tradition ? [profile.tradition] : []),
    languages: profile.languages ?? [],
    seekingIntent: profile.seekingIntent ?? '',
    interests: profile.interests ?? [],
  })

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
  }

  return (
    <div className="profile-edit-form" style={{ padding:'var(--space-4)' }}>
      <div className="input-group">
        <label>Display Name</label>
        <input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
      </div>
      <div className="input-group">
        <label>Bio</label>
        <textarea className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
      </div>
      <div className="input-group" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
        <div>
          <label>City</label>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
        </div>
        <div>
          <label>Country</label>
          <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" />
        </div>
      </div>
      <div className="input-group">
        <label>Temple / Sangha Affiliation</label>
        <input className="input" value={form.templeAffiliation} onChange={(e) => setForm({ ...form, templeAffiliation: e.target.value })} />
      </div>
      <div className="input-group">
        <label>Traditions</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)', marginTop:4 }}>
          {TRADITIONS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip-toggle${form.traditions.includes(t) ? ' active' : ''}`}
              onClick={() => setForm({ ...form, traditions: toggleArr(form.traditions, t) })}
            >
              {t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="input-group">
        <label>Languages</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)', marginTop:4 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              className={`chip-toggle${form.languages.includes(l) ? ' active' : ''}`}
              onClick={() => setForm({ ...form, languages: toggleArr(form.languages, l) })}
            >
              {LANG_LABELS[l] ?? l}
            </button>
          ))}
        </div>
      </div>
      <div className="input-group">
        <label>I am seeking to</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)', marginTop:4 }}>
          {INTENTS.map((intent) => (
            <button
              key={intent}
              type="button"
              className={`chip-toggle${form.seekingIntent === intent ? ' active' : ''}`}
              onClick={() => setForm({ ...form, seekingIntent: form.seekingIntent === intent ? '' : intent })}
            >
              {INTENT_LABELS[intent]}
            </button>
          ))}
        </div>
      </div>
      <div className="input-group">
        <label>Interests</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)', marginTop:4 }}>
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              className={`chip-toggle${form.interests.includes(interest) ? ' active' : ''}`}
              onClick={() => setForm({ ...form, interests: toggleArr(form.interests, interest) })}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:'var(--space-3)', marginTop:'var(--space-4)' }}>
        <button className="btn btn-primary" style={{ flex:1 }} onClick={() => onSave(form as unknown as Partial<UserProfile>)}>Save Changes</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export function ProfilePanel({ userId, onClose }: Props) {
  const { user, token } = useAuthStore()
  const { showToast } = useUiStore()
  const { data: profile, isLoading } = useUserProfile(userId)
  const { data: posts = [] } = useUserPosts(userId)
  const { data: participations } = useUserParticipations(userId)
  const follow = useFollowUser()
  const unfollow = useUnfollowUser()
  const saveProfile = useSaveProfile()
  const [activeTab, setActiveTab] = useState<PanelTab>('posts')
  const [following, setFollowing] = useState(false)
  const [editing, setEditing] = useState(false)

  const isOwnProfile = user?.id === userId

  function handleFollow() {
    if (!token) { showToast('Sign in to follow people', 'info'); return }
    if (following) {
      unfollow.mutate(userId, { onSuccess: () => setFollowing(false), onError: (e) => showToast((e as Error).message, 'error') })
    } else {
      follow.mutate(userId, { onSuccess: () => setFollowing(true), onError: (e) => showToast((e as Error).message, 'error') })
    }
  }

  function handleSave(data: Partial<UserProfile>) {
    saveProfile.mutate(data, {
      onSuccess: () => { showToast('Profile saved', 'success'); setEditing(false) },
      onError: (e) => showToast((e as Error).message, 'error'),
    })
  }

  return (
    <div className="panel-comm" style={{ zIndex: 50 }}>
      {/* Header */}
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Profile</span>
        {isOwnProfile && !editing && (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            <i className="fa-solid fa-pen-to-square" style={{ marginRight:4 }} /> Edit
          </button>
        )}
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        )}

        {profile && !editing && (
          <>
            {/* Cover */}
            <div className={`profile-cover ${tradClass(profile.traditions)}`}>
              {profile.coverPhoto && <img src={profile.coverPhoto} alt="" />}
              <div className="profile-avatar-wrap">
                {profile.profilePhoto
                  ? <img src={profile.profilePhoto} alt={profile.displayName} />
                  : <span>{initials(profile.displayName)}</span>}
              </div>
            </div>

            {/* Info */}
            <div className="profile-info">
              <div className="profile-name">
                {profile.displayName}
                {profile.isVerifiedTeacher && (
                  <span style={{ fontSize:'var(--text-xs)', background:'var(--saffron-100)', color:'var(--saffron-700)', padding:'2px 8px', borderRadius:'var(--radius-full)', fontWeight:500 }}>
                    Verified Teacher
                  </span>
                )}
              </div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-meta">
                {(profile.city || profile.country) && (
                  <span><i className="fa-solid fa-location-dot" /> {[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                )}
                {profile.templeAffiliation && (
                  <span><i className="fa-solid fa-place-of-worship" /> {profile.templeAffiliation}</span>
                )}
              </div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-value">{profile.postsCount}</div>
                  <div className="profile-stat-label">Posts</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{profile.followersCount}</div>
                  <div className="profile-stat-label">Followers</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{profile.followingCount}</div>
                  <div className="profile-stat-label">Following</div>
                </div>
              </div>
            </div>

            {/* Traditions */}
            {profile.traditions && profile.traditions.length > 0 && (
              <div className="profile-traditions">
                {profile.traditions.map((t) => (
                  <span key={t} className="profile-tradition-tag">
                    {t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            {!isOwnProfile && (
              <div className="profile-actions">
                <button
                  className={`btn ${following ? 'connected' : 'btn-primary'}`}
                  style={{ flex: 1 }}
                  onClick={handleFollow}
                  disabled={follow.isPending || unfollow.isPending}
                >
                  {following ? 'Connected' : 'Connect'}
                </button>
                <button className="btn btn-ghost" onClick={() => showToast('Messaging — coming soon', 'info')}>Message</button>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--border-subtle)', padding:'0 var(--space-4)' }}>
              {(['posts', 'about'] as PanelTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding:'var(--space-3) var(--space-4)',
                    background:'none',
                    border:'none',
                    borderBottom: activeTab === tab ? '2px solid var(--saffron-500)' : '2px solid transparent',
                    color: activeTab === tab ? 'var(--saffron-600)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab ? 600 : 400,
                    fontSize:'var(--text-sm)',
                    cursor:'pointer',
                    fontFamily:'inherit',
                    textTransform:'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Active In */}
            {participations && (() => {
              const now = new Date()
              const upcomingEvents = participations.events.filter(e => new Date(e.startsAt) > now)
              const items: { id: string; label: string; type: string }[] = [
                ...participations.circles.map(c => ({ id: c.id, label: c.topic, type: 'Circle' })),
                ...upcomingEvents.map(e => ({ id: e.id, label: e.title, type: 'Event' })),
                ...participations.courses.map(c => ({ id: c.id, label: c.title, type: 'Course' })),
                ...participations.sessions.map(s => ({ id: s.id, label: s.topic, type: 'Session' })),
              ]
              if (items.length === 0) return null
              return (
                <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:'var(--space-2)' }}>
                  <div className="section-title" style={{ padding:'var(--space-3) var(--space-4) var(--space-1)' }}>Active In</div>
                  {items.map(item => (
                    <button
                      key={item.type + item.id}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', borderBottom:'1px solid var(--border-subtle)', padding:'var(--space-3) var(--space-4)', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
                    >
                      <span style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-primary)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:'var(--space-3)' }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize:10, color:'var(--text-tertiary)', background:'var(--surface-sunken)', borderRadius:'var(--radius-sm)', padding:'2px 6px', flexShrink:0 }}>
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })()}

            {/* Tab content */}
            {activeTab === 'posts' && <PostList posts={posts} />}
            {activeTab === 'about' && (
              <div style={{ padding:'var(--space-4)' }}>
                {profile.seekingIntent && (
                  <div style={{ marginBottom:'var(--space-4)' }}>
                    <div className="section-title" style={{ padding:0, marginBottom:'var(--space-2)' }}>Seeking</div>
                    <span style={{ fontSize:'var(--text-sm)', color:'var(--saffron-600)', fontWeight:500 }}>
                      {INTENT_LABELS[profile.seekingIntent] ?? profile.seekingIntent}
                    </span>
                  </div>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <div style={{ marginBottom:'var(--space-4)' }}>
                    <div className="section-title" style={{ padding:0, marginBottom:'var(--space-2)' }}>Languages</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)' }}>
                      {profile.languages.map((l) => (
                        <span key={l} className="profile-tradition-tag">{LANG_LABELS[l] ?? l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <div className="section-title" style={{ padding:0, marginBottom:'var(--space-2)' }}>Interests</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)' }}>
                      {profile.interests.map((i) => (
                        <span key={i} className="profile-tradition-tag">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {profile && editing && (
          <EditForm profile={profile} onSave={handleSave} onCancel={() => setEditing(false)} />
        )}
      </div>
    </div>
  )
}
