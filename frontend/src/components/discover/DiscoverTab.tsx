'use client'

import { useState, useCallback, useRef } from 'react'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { PersonCard } from './PersonCard'
import { EventCard } from './EventCard'
import { EventDetailPanel } from './EventDetailPanel'
import { ProfilePanel } from './ProfilePanel'
import type { EventItem, DiscoverProject } from '@/types'
import { useDiscoverPeople, useDiscoverCategories, type PeopleFilter } from '@/hooks/useDiscover'
import { useEvents, type EventFilter } from '@/hooks/useEvents'
import { useProjects, type ProjectFilter } from '@/hooks/useProjects'
import { ProjectDetailPanel } from '@/components/communities/ProjectDetailPanel'

// ── Sub-tab types ─────────────────────────────────────────────
type DiscoverSubTab = 'people' | 'events' | 'projects'

// ── Intent chips ──────────────────────────────────────────────
const INTENT_CHIPS = [
  { label: 'Any', value: '' },
  { label: 'Seeking to Learn', value: 'LEARN' },
  { label: 'Open to Teaching', value: 'TEACH' },
  { label: 'Seeking Connection', value: 'CONNECT' },
  { label: 'Seeking Collaboration', value: 'COLLABORATE' },
  { label: 'Seeking to Volunteer', value: 'VOLUNTEER' },
]

const LANGUAGE_CHIPS = [
  { label: 'Any', value: '' },
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Sanskrit', value: 'sa' },
  { label: 'Telugu', value: 'te' },
  { label: 'Tamil', value: 'ta' },
]

// ── Event filter chips ────────────────────────────────────────
const EVENT_TYPE_CHIPS = [
  { label: 'All', value: 'ALL' },
  { label: 'Retreat', value: 'RETREAT' },
  { label: 'Talk', value: 'TALK' },
  { label: 'Seminar', value: 'SEMINAR' },
  { label: 'Gathering', value: 'GATHERING' },
  { label: 'Diksha', value: 'DIKSHA' },
  { label: 'Ambedkar Jayanti', value: 'AMBEDKAR_JAYANTI' },
]

const EVENT_MODE_CHIPS = [
  { label: 'Any', value: 'ANY' },
  { label: 'Online', value: 'ONLINE' },
  { label: 'In Person', value: 'IN_PERSON' },
  { label: 'Hybrid', value: 'HYBRID' },
]

// ── Project category chips ────────────────────────────────────
const PROJECT_CATEGORY_CHIPS = [
  { label: 'All', value: 'ALL' },
  { label: 'Education', value: 'EDUCATION' },
  { label: 'Social', value: 'SOCIAL' },
  { label: 'Arts', value: 'ARTS' },
  { label: 'Technology', value: 'TECHNOLOGY' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Environment', value: 'ENVIRONMENT' },
  { label: 'Health', value: 'HEALTH' },
  { label: 'Culture', value: 'CULTURE' },
  { label: 'Other', value: 'OTHER' },
]

// ── Helpers ───────────────────────────────────────────────────
function useDebounce(fn: (v: string) => void, delay: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((v: string) => {
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(() => fn(v), delay)
  }, [fn, delay])
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ padding:'var(--space-12) var(--space-4)', textAlign:'center', color:'var(--text-tertiary)' }}>
      <i className={`fa-solid ${icon}`} style={{ fontSize:36, marginBottom:'var(--space-3)', display:'block', opacity:.4 }} />
      <p style={{ fontSize:'var(--text-sm)' }}>{message}</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding:'var(--space-6) var(--space-4)', textAlign:'center', color:'var(--text-tertiary)' }}>
      <i className="fa-solid fa-triangle-exclamation" style={{ fontSize:28, marginBottom:'var(--space-2)', display:'block', color:'var(--saffron-400)' }} />
      <p style={{ fontSize:'var(--text-sm)' }}>{message}</p>
    </div>
  )
}

// ── People sub-tab ────────────────────────────────────────────
function PeoplePanel({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { token } = useAuthStore()
  const [filter, setFilter] = useState<PeopleFilter>({})
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [intent, setIntent] = useState('')
  const [lang, setLang] = useState('')
  const [teacherOnly, setTeacherOnly] = useState(false)

  const { data: categories = [] } = useDiscoverCategories()
  const [categoryId, setCategoryId] = useState('')

  const applyFilter = useCallback((newQ: string) => {
    setFilter({
      q: newQ || undefined,
      seekingIntent: intent || undefined,
      isVerifiedTeacher: teacherOnly || undefined,
      language: lang || undefined,
      categoryId: categoryId || undefined,
    })
  }, [intent, teacherOnly, lang, categoryId])

  const debouncedApply = useDebounce(applyFilter, 400)

  function handleQ(v: string) {
    setQ(v)
    debouncedApply(v)
  }

  function handleIntentChange(v: string) {
    setIntent(v)
    setFilter((f) => ({ ...f, seekingIntent: v || undefined }))
  }

  function handleLangChange(v: string) {
    setLang(v)
    setFilter((f) => ({ ...f, language: v || undefined }))
  }

  function handleTeacherChange(v: boolean) {
    setTeacherOnly(v)
    setFilter((f) => ({ ...f, isVerifiedTeacher: v || undefined }))
  }

  function handleCategoryChange(v: string) {
    setCategoryId(v)
    setFilter((f) => ({ ...f, categoryId: v || undefined }))
  }

  const { data: people = [], isLoading, error } = useDiscoverPeople(filter)

  return (
    <div>
      {/* Search + filters toggle */}
      <div style={{ padding:'var(--space-3) var(--space-4) 0' }}>
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            type="search"
            placeholder="Search people..."
            value={q}
            onChange={(e) => handleQ(e.target.value)}
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{ background:'none', border:'none', color: showFilters ? 'var(--saffron-800)' : 'var(--text-tertiary)', cursor:'pointer', fontSize:'var(--text-sm)', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}
          >
            <i className="fa-solid fa-sliders" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="discover-filters-panel" style={{ padding:'var(--space-3) var(--space-4)' }}>
          {/* Category chips */}
          {categories.length > 0 && (
            <div style={{ marginBottom:'var(--space-3)' }}>
              <div style={{ fontSize:'var(--text-xs)', fontWeight:600, color:'var(--text-tertiary)', marginBottom:'var(--space-2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Category</div>
              <div className="chip-scroll" style={{ padding:0 }}>
                <button
                  className={`chip${!categoryId ? ' active' : ''}`}
                  onClick={() => handleCategoryChange('')}
                >All</button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`chip${categoryId === cat.id ? ' active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intent chips */}
          <div style={{ marginBottom:'var(--space-3)' }}>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:600, color:'var(--text-tertiary)', marginBottom:'var(--space-2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Seeking</div>
            <div className="chip-scroll" style={{ padding:0 }}>
              {INTENT_CHIPS.map((c) => (
                <button
                  key={c.value}
                  className={`chip${intent === c.value ? ' active' : ''}`}
                  onClick={() => handleIntentChange(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher toggle */}
          <div style={{ marginBottom:'var(--space-3)', display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
            <button
              className={`chip-toggle${teacherOnly ? ' active' : ''}`}
              onClick={() => handleTeacherChange(!teacherOnly)}
            >
              <i className="fa-solid fa-graduation-cap" style={{ marginRight:4 }} />
              Verified Teacher only
            </button>
          </div>

          {/* Language chips */}
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:600, color:'var(--text-tertiary)', marginBottom:'var(--space-2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Language</div>
            <div className="chip-scroll" style={{ padding:0 }}>
              {LANGUAGE_CHIPS.map((c) => (
                <button
                  key={c.value}
                  className={`chip${lang === c.value ? ' active' : ''}`}
                  onClick={() => handleLangChange(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!token && <ErrorState message="Sign in to discover practitioners" />}
      {token && isLoading && <div className="spinner-center"><div className="spinner" /></div>}
      {token && error && <ErrorState message="Failed to load people" />}
      {token && !isLoading && !error && people.length === 0 && (
        <EmptyState icon="fa-users" message="No people found. Try adjusting your filters." />
      )}
      {token && !isLoading && people.map((p) => (
        <PersonCard key={p.id} person={p} onOpen={onOpenProfile} />
      ))}
    </div>
  )
}

// ── Events sub-tab ────────────────────────────────────────────
function EventsPanel({ onOpenEvent }: { onOpenEvent: (event: EventItem) => void }) {
  const { token } = useAuthStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('ALL')
  const [mode, setMode] = useState('ANY')
  const [mine, setMine] = useState(false)
  const [filter, setFilter] = useState<EventFilter>({})

  const debouncedQ = useDebounce((v: string) => setFilter((f) => ({ ...f, q: v || undefined })), 400)

  function handleQ(v: string) {
    setQ(v)
    debouncedQ(v)
  }

  function handleType(v: string) {
    setType(v)
    setFilter((f) => ({ ...f, type: v }))
  }

  function handleMode(v: string) {
    setMode(v)
    setFilter((f) => ({ ...f, mode: v }))
  }

  function handleMine(v: boolean) {
    setMine(v)
    setFilter((f) => ({ ...f, mine: v }))
  }

  const { data: events = [], isLoading, error } = useEvents(filter)

  return (
    <div>
      <div style={{ padding:'var(--space-3) var(--space-4) 0' }}>
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            type="search"
            placeholder="Search events..."
            value={q}
            onChange={(e) => handleQ(e.target.value)}
          />
        </div>
      </div>

      {/* Type filters */}
      <div className="chip-scroll">
        {EVENT_TYPE_CHIPS.map((c) => (
          <button
            key={c.value}
            className={`chip${type === c.value ? ' active' : ''}`}
            onClick={() => handleType(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Mode filters */}
      <div className="chip-scroll" style={{ paddingTop:0 }}>
        {EVENT_MODE_CHIPS.map((c) => (
          <button
            key={c.value}
            className={`chip${mode === c.value ? ' active' : ''}`}
            onClick={() => handleMode(c.value)}
          >
            {c.label}
          </button>
        ))}
        <button
          className={`chip${mine ? ' active' : ''}`}
          onClick={() => handleMine(!mine)}
        >
          <i className="fa-solid fa-bookmark" style={{ fontSize:11 }} />
          My Events
        </button>
      </div>

      {/* Results */}
      <div style={{ padding:'0 var(--space-4)' }}>
        {isLoading && <div className="spinner-center"><div className="spinner" /></div>}
        {error && <ErrorState message={!token ? 'Sign in to browse events' : 'Failed to load events'} />}
        {!isLoading && !error && events.length === 0 && (
          <EmptyState icon="fa-calendar-days" message="No events found. Try adjusting your filters." />
        )}
        {!isLoading && events.map((ev) => (
          <EventCard key={ev.id} event={ev} onOpen={() => onOpenEvent(ev)} />
        ))}
      </div>
    </div>
  )
}

// ── Projects sub-tab ──────────────────────────────────────────
function ProjectItem({ project, onOpen }: { project: DiscoverProject; onOpen: () => void }) {
  const icon = project.icon ?? '📌'
  const cat = project.category?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? ''
  return (
    <button className="project-list-item" onClick={onOpen}>
      <div className="project-list-icon">{icon}</div>
      <div className="project-list-body">
        <div className="project-list-title">{project.title}</div>
        <div className="project-list-meta">
          {cat && <span>{cat}</span>}
          {project._count.members > 0 && <span> · {project._count.members} members</span>}
          {project.lead && <span> · Led by {project.lead.displayName}</span>}
        </div>
        {project.purpose && <div className="project-list-purpose">{project.purpose}</div>}
        {project.skillsNeeded && project.skillsNeeded.length > 0 && (
          <div className="project-card-skills">
            {project.skillsNeeded.slice(0, 3).map((s) => (
              <span key={s} className="project-card-skill">{s}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function ProjectsPanel() {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('ALL')
  const [filter, setFilter] = useState<ProjectFilter>({ status: 'OPEN' })
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null)

  const debouncedQ = useDebounce((v: string) => setFilter((f) => ({ ...f, q: v || undefined })), 400)

  function handleQ(v: string) {
    setQ(v)
    debouncedQ(v)
  }

  function handleCategory(v: string) {
    setCategory(v)
    setFilter((f) => ({ ...f, category: v }))
  }

  const { data: projects = [], isLoading, error } = useProjects(filter)

  return (
    <div>
      <div style={{ padding:'var(--space-3) var(--space-4) 0' }}>
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            type="search"
            placeholder="Search projects..."
            value={q}
            onChange={(e) => handleQ(e.target.value)}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="chip-scroll">
        {PROJECT_CATEGORY_CHIPS.map((c) => (
          <button
            key={c.value}
            className={`chip${category === c.value ? ' active' : ''}`}
            onClick={() => handleCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div>
        {isLoading && <div className="spinner-center"><div className="spinner" /></div>}
        {error && <ErrorState message={!token ? 'Sign in to explore projects' : 'Failed to load projects'} />}
        {!isLoading && !error && projects.length === 0 && (
          <EmptyState icon="fa-diagram-project" message="No open projects found. Try adjusting your filters." />
        )}
        {!isLoading && projects.map((p) => (
          <ProjectItem key={p.id} project={p} onOpen={() => setViewingProjectId(p.id)} />
        ))}
      </div>
      {viewingProjectId && (
        <ProjectDetailPanel projectId={viewingProjectId} onClose={() => setViewingProjectId(null)} />
      )}
    </div>
  )
}

// ── Main DiscoverTab ──────────────────────────────────────────
export function DiscoverTab() {
  const [subTab, setSubTab] = useState<DiscoverSubTab>('people')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [eventDetail, setEventDetail] = useState<EventItem | null>(null)

  const tabs: { key: DiscoverSubTab; label: string; icon: string }[] = [
    { key: 'people', label: 'People', icon: 'fa-users' },
    { key: 'events', label: 'Events', icon: 'fa-calendar-days' },
    { key: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
  ]

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--surface-bg)' }}>
      {/* Sub-tab bar */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border-subtle)', background:'var(--surface-elevated)', flexShrink:0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            style={{
              flex:1,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'var(--space-2)',
              padding:'var(--space-3)',
              background:'none',
              border:'none',
              borderBottom: subTab === tab.key ? '2px solid var(--saffron-500)' : '2px solid transparent',
              color: subTab === tab.key ? 'var(--saffron-800)' : 'var(--text-secondary)',
              fontWeight: subTab === tab.key ? 600 : 400,
              fontSize:'var(--text-sm)',
              cursor:'pointer',
              fontFamily:'inherit',
              transition:'all var(--duration-fast)',
            }}
          >
            <i className={`fa-solid ${tab.icon}`} style={{ fontSize:14 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable content area */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {subTab === 'people' && <PeoplePanel onOpenProfile={setProfileId} />}
        {subTab === 'events' && <EventsPanel onOpenEvent={setEventDetail} />}
        {subTab === 'projects' && <ProjectsPanel />}
      </div>

      {/* Profile panel overlay */}
      {profileId && (
        <ProfilePanel
          userId={profileId}
          onClose={() => setProfileId(null)}
        />
      )}

      {/* Event detail overlay */}
      {eventDetail && (
        <EventDetailPanel
          event={eventDetail}
          onClose={() => setEventDetail(null)}
          onOpenProfile={(id) => { setEventDetail(null); setProfileId(id) }}
        />
      )}
    </div>
  )
}
