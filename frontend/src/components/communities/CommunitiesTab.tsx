'use client'

import { useState, useRef, useCallback } from 'react'
import { CommunityCard } from './CommunityCard'
import { CommunityDetail } from './CommunityDetail'
import { useAssociations, useMyAssociations, type AssociationFilter } from '@/hooks/useCommunities'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useUserProfile } from '@/hooks/useProfile'
import { CreateSanghaModal } from '@/components/create/CreateSanghaModal'
import { Avatar } from '@/components/ui/Avatar'

type CommView = 'grid' | 'list'

const FILTER_PILLS = [
  { label: 'All', filter: null },
  { label: 'Theravada', filter: { tradition: 'THERAVADA' } },
  { label: 'Mahayana', filter: { tradition: 'MAHAYANA' } },
  { label: 'Vajrayana', filter: { tradition: 'VAJRAYANA' } },
  { label: 'Temples', filter: { category: 'TEMPLE' } },
  { label: 'Sanghas', filter: { category: 'AMBEDKARITE_SANGHA' } },
  { label: 'Study Groups', filter: { category: 'STUDY_GROUP' } },
]

function tradIcon(tradition?: string | null) {
  if (tradition === 'THERAVADA') return 'fa-seedling'
  if (tradition === 'MAHAYANA') return 'fa-dharmachakra'
  if (tradition === 'VAJRAYANA') return 'fa-bell'
  return 'fa-landmark'
}

function tradStyle(tradition?: string | null) {
  if (tradition === 'THERAVADA') return { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', clr: '#16a34a' }
  if (tradition === 'MAHAYANA') return { bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', clr: '#d97706' }
  if (tradition === 'VAJRAYANA') return { bg: 'linear-gradient(135deg,#faf5ff,#f3e8ff)', clr: '#9333ea' }
  return { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', clr: '#2563EB' }
}

export function CommunitiesTab() {
  const { user, token } = useAuthStore()
  const { setTab, showToast } = useUiStore()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showCreateSangha, setShowCreateSangha] = useState(false)
  const [commView, setCommView] = useState<CommView>('grid')
  const [activeFilter, setActiveFilter] = useState<AssociationFilter | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filter: AssociationFilter = {
    ...activeFilter,
    ...(searchQuery.trim() ? { name: searchQuery.trim() } : {}),
  }
  const { data: associations = [], isLoading, error } = useAssociations(Object.keys(filter).length ? filter : undefined)
  const { data: myAssociations = [] } = useMyAssociations()

  const handleSearch = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(val), 400)
  }, [])

  const handleFilterClick = (f: AssociationFilter | null) => {
    setActiveFilter(f)
    setSearchQuery('')
  }

  const { data: myProfile } = useUserProfile(user?.id ?? null)
  const commCount = myAssociations.length
  const connectionsCount = myProfile?.followersCount ?? null

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100%', fontFamily: 'var(--font-body)' }}>
      <div className="pt-4 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3">
            <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(199,154,59,0.1)' }}>
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar src={user.profilePhoto ?? null} name={user.displayName} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sangham-ink text-sm truncate">{user.displayName}</h3>
                        <p className="text-xs text-sangham-brown-light truncate">@{user.username ?? 'practitioner'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-sangham-cream rounded-lg p-2">
                        <div className="font-bold text-sangham-ink text-sm">{commCount}</div>
                        <div style={{ fontSize: 10 }} className="text-sangham-brown-light">Communities</div>
                      </div>
                      <div className="bg-sangham-cream rounded-lg p-2">
                        <div className="font-bold text-sangham-ink text-sm">{connectionsCount ?? '—'}</div>
                        <div style={{ fontSize: 10 }} className="text-sangham-brown-light">Connections</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-1">
                    <i className="fa-solid fa-seedling text-2xl mb-3 block" style={{ color: '#C79A3B' }} />
                    <p className="text-sm font-semibold text-sangham-ink mb-1">Welcome to Sangham</p>
                    <p className="text-xs text-sangham-brown-light mb-3">Sign in to join and manage your communities</p>
                    <a href="/login" className="btn btn-primary btn-sm" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>Sign In</a>
                  </div>
                )}
              </div>

              {/* Nav */}
              <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: '1px solid rgba(199,154,59,0.1)' }}>
                <h4 className="text-xs font-semibold text-sangham-brown-light uppercase tracking-wider mb-3 px-2">Menu</h4>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sangham-cream text-sangham-ink-light text-sm transition-colors w-full text-left"
                    onClick={() => setTab('home')}
                  >
                    <i className="fa-solid fa-house w-5 text-center text-sangham-brown-light" />Home Feed
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left" style={{ background: 'rgba(199,154,59,0.05)', color: '#8B6621' }}>
                    <i className="fa-solid fa-user-group w-5 text-center" />My Communities
                  </button>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sangham-cream text-sangham-ink-light text-sm transition-colors w-full text-left"
                    onClick={() => { setTab('learn') }}
                  >
                    <i className="fa-solid fa-book-bookmark w-5 text-center text-sangham-brown-light" />Saved Teachings
                  </button>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sangham-cream text-sangham-ink-light text-sm transition-colors w-full text-left"
                    onClick={() => setTab('discover')}
                  >
                    <i className="fa-solid fa-compass w-5 text-center text-sangham-brown-light" />Discover People
                  </button>
                </nav>
              </div>

              {/* My Sanghas */}
              {myAssociations.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: '1px solid rgba(199,154,59,0.1)' }}>
                  <h4 className="text-xs font-semibold text-sangham-brown-light uppercase tracking-wider mb-3 px-2">My Sanghas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {myAssociations.slice(0, 5).map((a) => {
                      const ts = tradStyle(a.tradition)
                      return (
                        <button
                          key={a.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sangham-cream text-sangham-ink-light text-xs transition-colors w-full text-left"
                          onClick={() => setDetailId(a.id)}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ts.bg, color: ts.clr }}>
                            <i className={`fa-solid ${tradIcon(a.tradition)} text-[10px]`} />
                          </div>
                          <span className="truncate">{a.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* CENTER CONTENT */}
          <main className="lg:col-span-9" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl font-bold text-sangham-ink">Sanghas</h1>
                <p className="text-sm text-sangham-brown-light mt-1">Discover and join communities that resonate with your practice</p>
              </div>
              <button
                className="flex items-center gap-2 px-3 py-2.5 sm:px-5 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg,#8B6621 0%,#6B4E17 100%)', boxShadow: '0 4px 12px rgba(199,154,59,0.2)', minHeight: 44 }}
                onClick={() => token ? setShowCreateSangha(true) : showToast('Sign in to create a Sangha', 'info')}
              >
                <i className="fa-solid fa-plus" /><span className="hidden sm:inline">New Sangha</span>
              </button>
            </div>

            {/* Your Communities chips */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(199,154,59,0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-sangham-brown-light uppercase tracking-widest">Your Communities</h2>
                <button
                  className="text-xs font-medium px-2 rounded-lg"
                  style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#C79A3B' }}
                  onClick={() => {
                    const presided = myAssociations.find((a) => a.memberRole === 'PRESIDENT')
                    if (presided) setDetailId(presided.id)
                    else showToast("You're not an admin of any community yet", 'info')
                  }}
                >
                  Manage
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {myAssociations.length === 0 && !token && (
                  <p className="text-xs text-sangham-brown-light">Sign in to see your communities.</p>
                )}
                {myAssociations.length === 0 && token && (
                  <p className="text-xs text-sangham-brown-light">You have not joined any communities yet.</p>
                )}
                {myAssociations.map((a) => (
                  <button
                    key={a.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sangham-cream hover:bg-sangham-gold/10 text-sangham-ink text-xs font-medium rounded-lg transition-colors"
                    style={{ border: '1px solid rgba(199,154,59,0.1)', minHeight: 44 }}
                    onClick={() => setDetailId(a.id)}
                  >
                    <i className={`fa-solid ${tradIcon(a.tradition)} text-[11px]`} style={{ color: '#C79A3B' }} />
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(199,154,59,0.1)' }}>
              <div className="relative mb-4">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sangham-brown-light" />
                <input
                  type="text"
                  placeholder="Search communities, sanghas, temples, study groups..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-sangham-cream rounded-xl pl-11 pr-4 py-3 text-base text-sangham-ink placeholder-sangham-brown-light/60 focus:outline-none transition-all"
                  style={{ border: '1px solid transparent' }}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ touchAction: 'pan-x' }}>
                {FILTER_PILLS.map((pill) => {
                  const isActive = pill.filter === null
                    ? activeFilter === null
                    : JSON.stringify(pill.filter) === JSON.stringify(activeFilter)
                  return (
                    <button
                      key={pill.label}
                      className={`filter-pill px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap${isActive ? ' active' : ' bg-white text-sangham-brown-light'}`}
                      style={isActive ? {} : { border: '1px solid rgba(199,154,59,0.1)' }}
                      onClick={() => handleFilterClick(pill.filter as AssociationFilter | null)}
                    >
                      {pill.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* View Toggle & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
              <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm" style={{ border: '1px solid rgba(199,154,59,0.1)' }}>
                <button
                  className="px-4 py-2.5 text-xs font-medium rounded-lg transition-colors"
                  style={{ minHeight: 44, background: commView === 'grid' ? '#8B6621' : 'transparent', color: commView === 'grid' ? 'white' : 'var(--text-secondary)' }}
                  onClick={() => setCommView('grid')}
                >
                  Grid
                </button>
                <button
                  className="px-4 py-2.5 text-xs font-medium rounded-lg transition-colors"
                  style={{ minHeight: 44, background: commView === 'list' ? '#8B6621' : 'transparent', color: commView === 'list' ? 'white' : 'var(--text-secondary)' }}
                  onClick={() => setCommView('list')}
                >
                  List
                </button>
                <button
                  className="px-4 py-2.5 text-xs font-medium rounded-lg transition-colors text-sangham-brown-light hover:text-sangham-ink"
                  style={{ minHeight: 44 }}
                  onClick={() => showToast('Map view coming soon', 'info')}
                >
                  Map
                </button>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs text-sangham-brown-light">Sort by:</span>
                <select
                  className="bg-white rounded-lg px-3 py-2 text-xs text-sangham-ink focus:outline-none cursor-pointer"
                  style={{ border: '1px solid rgba(199,154,59,0.1)', minHeight: 44 }}
                  onChange={() => showToast('Sorting coming soon', 'info')}
                >
                  <option>Recommended</option>
                  <option>Nearest</option>
                  <option>Most Active</option>
                  <option>Newest</option>
                  <option>Largest</option>
                </select>
              </div>
            </div>

            {/* Community grid/list */}
            {isLoading ? (
              <div className="spinner-center" style={{ padding: 'var(--space-16) 0' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-16) 0', color: 'var(--text-tertiary)' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', marginBottom: 'var(--space-2)', display: 'block', color: 'var(--saffron-400)' }} />
                <div className="font-medium">{!token ? 'Sign in to see communities' : 'Could not load communities'}</div>
              </div>
            ) : associations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2rem', marginBottom: 'var(--space-3)', display: 'block', color: 'var(--saffron-300)' }} />
                <h3 className="font-semibold text-sangham-ink mb-1">No communities found</h3>
                <p className="text-sm text-sangham-brown-light">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`comm-list ${commView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-3'}`}>
                {associations.map((a) => (
                  <CommunityCard key={a.id} a={a} onOpen={() => setDetailId(a.id)} isMember={myAssociations.some(m => m.id === a.id)} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Community detail panel */}
      {detailId && (
        <CommunityDetail assocId={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Create Sangha modal */}
      {showCreateSangha && (
        <CreateSanghaModal
          onClose={() => setShowCreateSangha(false)}
          onCreated={(id) => { setShowCreateSangha(false); setDetailId(id) }}
        />
      )}
    </div>
  )
}
