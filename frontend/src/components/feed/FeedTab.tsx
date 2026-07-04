'use client'

import { useState, useEffect, useRef } from 'react'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { PostCard } from './PostCard'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import {
  useFeed,
  useDailyVerse,
  useTrendingCommunities,
  useSuggestedConnections,
  useSidebarEvents,
  useCreatePost,
} from '@/hooks/useFeed'
import { useMyAssociations } from '@/hooks/useCommunities'
import { useUserProfile } from '@/hooks/useProfile'
import { useUploadMedia } from '@/hooks/useMessages'
import { api } from '@/lib/api/client'
import type { FeedPost } from '@/types'

// ── Weekly Activity ───────────────────────────────────────────

function WeeklyActivity() {
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set())
  const [streak, setStreak] = useState(0)
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  useEffect(() => {
    const KEY = 'sangham_activity_days'
    const jsDay = new Date().getDay()
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1
    let stored: { weekStart?: string; days?: number[] } = {}
    try { stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch {}
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - todayIdx)
    const weekStart = d.toISOString().slice(0, 10)
    if (stored.weekStart !== weekStart) stored = { weekStart, days: [] }
    if (!stored.days) stored.days = []
    if (!stored.days.includes(todayIdx)) stored.days.push(todayIdx)
    try { localStorage.setItem(KEY, JSON.stringify(stored)) } catch {}
    setActiveDays(new Set(stored.days))
    setStreak(stored.days.length)
  }, [])

  const streakText =
    streak >= 7 ? 'Perfect week! 🙏' :
    streak >= 5 ? `${streak}-day streak — keep going!` :
    streak >= 2 ? `${streak} days active this week` :
    'Day 1 — great start!'

  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

  return (
    <div
      className="rounded-2xl p-5 text-white"
      style={{ background: 'linear-gradient(135deg,#8B6621 0%,#6B4E17 100%)', boxShadow: '0 8px 24px -4px rgba(199,154,59,0.35)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Weekly Activity</h4>
        <i className="fa-solid fa-spa" style={{ opacity: .7 }} />
      </div>
      <div className="flex gap-1.5 mb-3">
        {dayLabels.map((label, i) => {
          const isToday = i === todayIdx
          const isActive = activeDays.has(i)
          return (
            <div
              key={i}
              className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
              style={{
                background: isToday ? 'rgba(255,255,255,0.92)' : isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
                color: isToday ? '#C79A3B' : isActive ? 'rgba(199,154,59,0.8)' : '',
                fontWeight: isToday ? 700 : isActive ? 600 : undefined,
              }}
            >
              {label}
            </div>
          )
        })}
      </div>
      <p className="text-xs" style={{ opacity: .9 }}>{streakText}</p>
    </div>
  )
}

// ── Left sidebar ──────────────────────────────────────────────

function LeftSidebar() {
  const { user } = useAuthStore()
  const { setTab, showToast, openSettings } = useUiStore()
  const { data: myAssociations = [] } = useMyAssociations()
  const { data: myProfile } = useUserProfile(user?.id ?? null)
  const handle = user?.username ? `@${user.username}` : '@practitioner'
  const commCount = myAssociations.length
  const connCount = myProfile?.followersCount ?? null

  return (
    <div className="sticky top-24" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
        {user ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Avatar src={user.profilePhoto ?? null} name={user.displayName} size="md" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sangham-ink text-sm truncate">{user.displayName}</h3>
                <p className="text-xs text-sangham-brown-light truncate">{handle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[[String(commCount), 'Communities'], [connCount !== null ? String(connCount) : '—', 'Connections']].map(([val, lbl]) => (
                <div key={lbl} className="bg-sangham-cream rounded-lg p-2">
                  <div className="font-bold text-sangham-ink text-sm">{val}</div>
                  <div className="text-[10px] text-sangham-brown-light">{lbl}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-1">
            <i className="fa-solid fa-seedling text-2xl mb-3 block" style={{ color: '#C79A3B' }} />
            <p className="text-sm font-semibold text-sangham-ink mb-1">Welcome to Sangham</p>
            <p className="text-xs text-sangham-brown-light mb-3">Sign in to track your practice and connect with practitioners</p>
            <a href="/login" className="btn btn-primary btn-sm" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>Sign In</a>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sangham-gold/10">
        <h4 className="text-xs font-semibold text-sangham-brown-light uppercase tracking-wider mb-3 px-2">Menu</h4>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { icon: 'fa-house',          label: 'Home Feed',        action: () => setTab('home') },
            { icon: 'fa-user-group',     label: 'My Communities',   action: () => setTab('communities') },
            { icon: 'fa-book-bookmark',  label: 'Saved Teachings',  action: () => setTab('learn') },
            { icon: 'fa-compass',        label: 'Discover People',  action: () => setTab('discover') },
            { icon: 'fa-message',        label: 'Messages',         action: () => setTab('messages') },
            { icon: 'fa-hand-holding-heart', label: 'Contribute',   action: () => showToast('Contribute — coming soon', 'info') },
            { icon: 'fa-gear',           label: 'Settings',         action: openSettings },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              className="lsb-menu-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left hover:bg-sangham-cream text-sangham-ink-light"
              onClick={action}
            >
              <i className={`fa-solid ${icon} w-5 text-center`} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <WeeklyActivity />
    </div>
  )
}

// ── Right sidebar ─────────────────────────────────────────────

function RightSidebar() {
  const { setTab } = useUiStore()
  const verse = useDailyVerse()
  const trending = useTrendingCommunities()
  const suggested = useSuggestedConnections()
  const events = useSidebarEvents()

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

  return (
    <div className="sticky top-24" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Daily Wisdom */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#8B6621 0%,#6B4E17 100%)', boxShadow: '0 8px 24px -4px rgba(199,154,59,0.35)' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-quote-left text-lg" style={{ opacity: .5 }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ opacity: .9 }}>Daily Wisdom</span>
          </div>
          {verse.isPending ? (
            <p className="font-serif text-sm leading-relaxed italic mb-2" style={{ opacity: .7 }}>Loading verse…</p>
          ) : verse.data?.content ? (
            <>
              <p className="font-serif text-sm leading-relaxed italic mb-2" style={{ opacity: .97 }}>
                {verse.data.content}
              </p>
              {verse.data.source && (
                <div className="text-[10px] mb-4" style={{ opacity: .7 }}>{verse.data.source}</div>
              )}
            </>
          ) : (
            <p className="font-serif text-sm leading-relaxed italic mb-2" style={{ opacity: .7 }}>
              &ldquo;In the sky, there is no distinction of east and west; people create distinctions out of their own minds.&rdquo;
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.18)' }}
              onClick={() => setTab('learn')}
            >
              Read More
            </button>
          </div>
        </div>
      </div>

      {/* Trending Communities */}
      {trending.data && trending.data.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-sangham-ink text-sm">Trending Communities</h3>
            <button onClick={() => setTab('communities')} className="text-[10px] text-sangham-gold hover:text-sangham-gold-dark font-medium">Explore</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trending.data.map((c) => {
              const members = c._count?.members ?? c.memberCount ?? 0
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sangham-cream flex-shrink-0 flex items-center justify-center">
                    <i className="fa-solid fa-dharmachakra text-sangham-gold text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sangham-ink text-xs truncate">{c.name}</h4>
                    {members > 0 && <p className="text-[10px] text-sangham-brown-light">{members.toLocaleString()} members</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Suggested Connections */}
      {suggested.data && suggested.data.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-sangham-ink text-sm">Suggested Connections</h3>
            <button onClick={() => setTab('discover')} className="text-[10px] text-sangham-gold hover:text-sangham-gold-dark font-medium">See All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggested.data.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar src={p.profilePhoto ?? null} name={p.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-sangham-ink truncate">{p.displayName}</div>
                  {p.tradition && <div className="text-[10px] text-sangham-brown-light">{p.tradition}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {events.data && events.data.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-sangham-ink text-sm">Upcoming Events</h3>
            <button onClick={() => setTab('discover')} className="text-[10px] text-sangham-gold hover:text-sangham-gold-dark font-medium">Calendar</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.data.map((ev) => {
              const d = new Date(ev.startsAt)
              return (
                <div key={ev.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(253,248,240,.5)' }}>
                  <div className="w-10 h-10 rounded-lg bg-sangham-cream flex-shrink-0 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-sangham-gold uppercase">{MONTHS[d.getMonth()]}</span>
                    <span className="text-base font-bold text-sangham-ink leading-none">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="text-xs font-medium text-sangham-ink truncate">{ev.title}</div>
                    {ev.location && <div className="text-[10px] text-sangham-brown-light">{ev.location}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="flex items-center justify-center gap-3 text-[10px] text-sangham-brown-light">
          {['About', 'Privacy', 'Terms', 'Help'].map((label, i) => (
            <span key={label} className="flex items-center gap-3">
              {i > 0 && <span>·</span>}
              <a href="#" className="hover:text-sangham-gold transition-colors">{label}</a>
            </span>
          ))}
        </div>
        <p className="text-[10px] text-sangham-brown-light/60">© 2026 Sangham</p>
      </div>
    </div>
  )
}

// ── Center feed ───────────────────────────────────────────────

const FILTERS = [
  { id: 'all',         label: 'All Activity' },
  { id: 'communities', label: 'My Communities' },
  { id: 'connections', label: 'Connections' },
  { id: 'teachings',   label: 'Teachings' },
  { id: 'events',      label: 'Events' },
]

function CenterFeed() {
  const { user } = useAuthStore()
  const { showToast, setTab, viewProfile } = useUiStore()
  const [filter, setFilter] = useState('all')
  const [extraPosts, setExtraPosts] = useState<FeedPost[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const { token } = useAuthStore()
  const { data: posts, isPending, isError, error } = useFeed(filter)
  const { data: suggestedPeople = [] } = useSuggestedConnections()
  const [postText, setPostText] = useState('')
  const createPost = useCreatePost()
  const uploadMedia = useUploadMedia()
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; previewUrl: string } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingPhoto({ file, previewUrl: URL.createObjectURL(file) })
    e.target.value = ''
  }

  function removePendingPhoto() {
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.previewUrl)
    setPendingPhoto(null)
  }

  async function handlePost() {
    const content = postText.trim()
    if ((!content && !pendingPhoto) || createPost.isPending || uploadMedia.isPending) return
    try {
      let mediaUrls: string[] | undefined
      if (pendingPhoto) {
        const url = await uploadMedia.mutateAsync(pendingPhoto.file)
        mediaUrls = [url]
      }
      await createPost.mutateAsync({ content, mediaUrls, postType: mediaUrls ? 'IMAGE' : 'TEXT' })
      setPostText('')
      removePendingPhoto()
      showToast('Posted', 'success')
    } catch (err) {
      showToast((err as Error).message || 'Failed to post', 'error')
    }
  }

  useEffect(() => {
    setExtraPosts([])
    setHasMore(false)
  }, [filter])

  useEffect(() => {
    if (posts) setHasMore(posts.length >= 20)
  }, [posts])

  async function loadMore() {
    if (!token || loadingMore) return
    setLoadingMore(true)
    try {
      const offset = (posts?.length ?? 0) + extraPosts.length
      const filterParam = filter !== 'all' ? `&filter=${filter}` : ''
      const raw = await api.get<{ data?: FeedPost[] } | FeedPost[]>(
        `/users/me/community-feed?limit=20&skip=${offset}${filterParam}`,
        token,
      )
      const more = Array.isArray(raw) ? raw : ((raw as { data?: FeedPost[] }).data ?? [])
      setExtraPosts((p) => [...p, ...more])
      setHasMore(more.length >= 20)
    } catch {
      showToast('Failed to load more posts', 'error')
    } finally {
      setLoadingMore(false)
    }
  }

  const allPosts = [...(posts ?? []), ...extraPosts]

  return (
    <div className="md:col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stories strip — only when we have suggestions */}
      {suggestedPeople.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-sangham-ink">Suggested Practitioners</h2>
            <button onClick={() => setTab('discover')} className="text-xs text-sangham-gold hover:text-sangham-gold-dark font-medium px-3 rounded-lg" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ touchAction: 'pan-x' }}>
            {suggestedPeople.map((p) => (
              <button key={p.id} onClick={() => viewProfile(p.id)} className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer">
                <Avatar src={p.profilePhoto ?? null} name={p.displayName} size="lg" />
                <span className="text-[11px] text-sangham-brown-light truncate" style={{ maxWidth: 64 }}>
                  {p.displayName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create post box */}
      {user && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
          <div className="flex gap-3">
            <Avatar src={user.profilePhoto ?? null} name={user.displayName} size="sm" />
            <div className="flex-1">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share your thoughts, questions, or insights…"
                maxLength={1000}
                rows={postText ? 3 : 1}
                disabled={createPost.isPending}
                className="feed-composer-textarea w-full bg-sangham-cream rounded-xl px-4 py-3 text-base text-left transition-all hover:bg-sangham-cream-dark"
                style={{ border: 'none', cursor: 'text', fontFamily: 'inherit', minHeight: 48, color: 'var(--text-primary)', resize: 'none', boxSizing: 'border-box' }}
              />
              {pendingPhoto && (
                <div style={{ position: 'relative', display: 'inline-block', marginTop: 'var(--space-3)' }}>
                  <img src={pendingPhoto.previewUrl} alt="" style={{ maxHeight: 160, borderRadius: 12, display: 'block' }} />
                  <button
                    onClick={removePendingPhoto}
                    aria-label="Remove photo"
                    style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="flex gap-2" style={{ flexShrink: 0, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg hover:bg-sangham-cream text-sangham-brown-light text-xs transition-colors"
                    style={{ minHeight: 44, padding: '0.5rem 0.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    <i className="fa-solid fa-image text-sangham-gold" />
                    <span>Photo</span>
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
                  {[{ icon: 'fa-link', label: 'Link' }, { icon: 'fa-quote-right', label: 'Quote' }].map(({ icon, label }) => (
                    <button
                      key={label}
                      onClick={() => showToast(`${label} — coming soon`, 'info')}
                      className="flex items-center gap-1.5 rounded-lg hover:bg-sangham-cream text-sangham-brown-light text-xs transition-colors"
                      style={{ minHeight: 44, padding: '0.5rem 0.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      <i className={`fa-solid ${icon} text-sangham-gold`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handlePost}
                  disabled={(!postText.trim() && !pendingPhoto) || createPost.isPending || uploadMedia.isPending}
                  className="hover:opacity-90 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-sangham-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ minHeight: 44, padding: '0.625rem 1.25rem', background: '#8B6621', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {(createPost.isPending || uploadMedia.isPending) ? <Spinner size="sm" /> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" style={{ touchAction: 'pan-x' }}>
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            className={`feed-filter-pill px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors border${filter === id ? ' active' : ' bg-white text-sangham-brown-light border-sangham-gold/10'}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, var(--surface-bg), transparent)', pointerEvents: 'none' }} />
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {isPending && !user && (
          <div className="empty-state" style={{ padding: '4rem 1rem' }}>
            <div className="empty-state-icon"><i className="fa-solid fa-seedling" style={{ color: 'var(--saffron-300)' }} /></div>
            <div className="empty-state-title">Join the conversation</div>
            <div className="empty-state-body">Sign in to see discussions from your communities.</div>
          </div>
        )}
        {isPending && user && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Spinner size="lg" />
          </div>
        )}
        {isError && (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--saffron-400)' }} /></div>
            <div className="empty-state-title">Couldn't load feed</div>
            <div className="empty-state-body">{(error as Error)?.message ?? 'Something went wrong'}</div>
          </div>
        )}
        {!isPending && !isError && allPosts.length === 0 && (
          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
            <div className="empty-state-icon"><i className="fa-solid fa-comment-dots" style={{ color: 'var(--saffron-300)' }} /></div>
            <div className="empty-state-title">No discussions yet</div>
            <div className="empty-state-body">Join communities to see their active discussions here.</div>
          </div>
        )}
        {allPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-white border border-sangham-gold/20 text-sangham-gold hover:bg-sangham-gold hover:text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {loadingMore ? <Spinner size="sm" /> : 'Load More Activity'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main FeedTab export ───────────────────────────────────────

export function FeedTab() {
  return (
    <div className="pt-4 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <aside className="hidden md:block md:col-span-3">
          <LeftSidebar />
        </aside>

        {/* Center feed */}
        <CenterFeed />

        {/* Right sidebar */}
        <aside className="hidden md:block md:col-span-3">
          <RightSidebar />
        </aside>
      </div>
    </div>
  )
}
