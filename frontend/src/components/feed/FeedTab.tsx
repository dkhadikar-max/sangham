'use client'

import { useState, useEffect } from 'react'
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
} from '@/hooks/useFeed'
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
      style={{ background: 'linear-gradient(135deg,#C79A3B 0%,#B2872F 100%)', boxShadow: '0 8px 24px -4px rgba(199,154,59,0.35)' }}
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
  const { setTab } = useUiStore()
  const handle = user?.username ? `@${user.username}` : '@practitioner'
  const initials = (user?.displayName ?? 'U').charAt(0).toUpperCase()

  return (
    <div className="sticky top-24 space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-sangham-gold/20 flex-shrink-0 bg-sangham-cream flex items-center justify-center">
            {user?.profilePhoto
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--saffron-600)' }}>{initials}</span>}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sangham-ink text-sm truncate">{user?.displayName ?? '—'}</h3>
            <p className="text-xs text-sangham-brown-light truncate">{handle}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['—', 'Communities'], ['—', 'Connections'], ['—', 'Karma']].map(([val, lbl]) => (
            <div key={lbl} className="bg-sangham-cream rounded-lg p-2">
              <div className="font-bold text-sangham-ink text-sm">{val}</div>
              <div className="text-[10px] text-sangham-brown-light">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sangham-gold/10">
        <h4 className="text-xs font-semibold text-sangham-brown-light uppercase tracking-wider mb-3 px-2">Menu</h4>
        <nav className="space-y-1">
          {[
            { icon: 'fa-house',          label: 'Home Feed',        action: () => setTab('home') },
            { icon: 'fa-user-group',     label: 'My Communities',   action: () => setTab('communities') },
            { icon: 'fa-book-bookmark',  label: 'Saved Teachings',  action: () => setTab('learn') },
            { icon: 'fa-compass',        label: 'Discover People',  action: () => setTab('discover') },
            { icon: 'fa-hand-holding-heart', label: 'Contribute',   action: () => {} },
            { icon: 'fa-gear',           label: 'Settings',         action: () => {} },
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
    <div className="sticky top-24 space-y-6">
      {/* Daily Wisdom */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#C79A3B 0%,#B2872F 100%)', boxShadow: '0 8px 24px -4px rgba(199,154,59,0.35)' }}
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
          <div className="space-y-3">
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
          <div className="space-y-3">
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
          <div className="space-y-3">
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
      <div className="text-center space-y-2">
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
  const { showToast } = useUiStore()
  const [filter, setFilter] = useState('all')
  const [extraPosts, setExtraPosts] = useState<FeedPost[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const { token } = useAuthStore()
  const { data: posts, isPending, isError, error } = useFeed(filter)

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
    <div className="md:col-span-6 space-y-6">
      {/* Stories strip */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-sangham-ink">Suggested Practitioners</h2>
          <button className="text-xs text-sangham-gold hover:text-sangham-gold-dark font-medium px-3 rounded-lg" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
            View All
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ touchAction: 'pan-x' }}>
          <button className="flex-shrink-0 flex flex-col items-center gap-1.5 group bg-transparent border-0 p-0" aria-label="Create a post">
            <div className="w-16 h-16 rounded-full bg-sangham-cream border-2 border-dashed border-sangham-gold/30 flex items-center justify-center group-hover:border-sangham-gold transition-colors">
              <i className="fa-solid fa-plus text-sangham-gold" />
            </div>
            <span className="text-[11px] text-sangham-brown-light">Post</span>
          </button>
        </div>
      </div>

      {/* Create post box */}
      {user && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sangham-gold/10">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sangham-gold/20 flex-shrink-0 bg-sangham-cream flex items-center justify-center">
              {user.profilePhoto
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontWeight: 600, color: 'var(--saffron-600)' }}>{(user.displayName ?? 'U').charAt(0)}</span>}
            </div>
            <div className="flex-1">
              <button
                type="button"
                className="w-full bg-sangham-cream rounded-xl px-4 py-3 text-base text-left transition-all hover:bg-sangham-cream-dark"
                style={{ border: 'none', cursor: 'text', fontFamily: 'inherit', minHeight: 48, color: 'rgba(139,115,85,0.6)' }}
              >
                Share your thoughts, questions, or insights…
              </button>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  {[{ icon: 'fa-image', label: 'Photo' }, { icon: 'fa-link', label: 'Link' }, { icon: 'fa-quote-right', label: 'Quote' }].map(({ icon, label }) => (
                    <button key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-sangham-cream text-sangham-brown-light text-xs transition-colors" style={{ minHeight: 44 }}>
                      <i className={`fa-solid ${icon} text-sangham-gold`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="px-5 py-2.5 bg-sangham-gold hover:bg-sangham-gold-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-sangham-gold/20"
                  style={{ minHeight: 44 }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter pills */}
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

      {/* Posts */}
      <div className="space-y-5">
        {isPending && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Spinner size="lg" />
          </div>
        )}
        {isError && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Couldn't load feed</div>
            <div className="empty-state-body">{(error as Error)?.message ?? 'Something went wrong'}</div>
          </div>
        )}
        {!isPending && !isError && allPosts.length === 0 && (
          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
            <div className="empty-state-icon">💬</div>
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
