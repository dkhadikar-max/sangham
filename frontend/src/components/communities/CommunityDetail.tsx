'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAssociation,
  useAssociationMembership,
  useJoinAssociation,
  useLeaveAssociation,
  useCommunityLearning,
  useCommunityProjects,
  useCommunityCircles,
} from '@/hooks/useCommunities'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MemberManagementPanel } from './MemberManagementPanel'
import { CreateEventModal } from '@/components/create/CreateEventModal'
import { EventDetailPanel } from '@/components/discover/EventDetailPanel'
import { useEvent } from '@/hooks/useEvents'
import { CourseDetailPanel } from '@/components/learn/CourseDetailPanel'
import { ProjectDetailPanel } from './ProjectDetailPanel'
import { CircleDetailPanel } from './CircleDetailPanel'
import { CreateCircleModal } from './CreateCircleModal'
import type {
  AssociationDetail,
  AssociationMembership,
  CommunityCourse,
  CommunityResource,
  CommunityProject,
  CommunityCircle,
} from '@/types'

type DetailTab = 'overview' | 'learning' | 'projects' | 'circles' | 'contributions'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function tradIcon(tradition?: string | null) {
  if (tradition === 'THERAVADA') return '🪷'
  if (tradition === 'MAHAYANA') return '☸️'
  if (tradition === 'VAJRAYANA') return '🔔'
  return '🕌'
}

function tradGrad(tradition?: string | null) {
  if (tradition === 'THERAVADA') return 'linear-gradient(135deg,#4ade80,#059669)'
  if (tradition === 'MAHAYANA') return 'linear-gradient(135deg,#fbbf24,#f97316)'
  if (tradition === 'VAJRAYANA') return 'linear-gradient(135deg,#c084fc,#4f46e5)'
  return 'linear-gradient(135deg,var(--saffron-200),var(--saffron-400))'
}

// ── Sub-tab panels ─────────────────────────────────────────────

function EventDetailById({ eventId, onClose, onOpenProfile }: { eventId: string; onClose: () => void; onOpenProfile: (id: string) => void }) {
  const { data: event, isLoading } = useEvent(eventId)
  if (isLoading || !event) {
    return (
      <div className="panel-comm" style={{ zIndex: 55 }}>
        <div className="panel-header">
          <button className="panel-back" onClick={onClose} aria-label="Close"><i className="fa-solid fa-arrow-left" /></button>
          <span className="panel-title">Event Details</span>
        </div>
        <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
      </div>
    )
  }
  return <EventDetailPanel event={event} onClose={onClose} onOpenProfile={onOpenProfile} />
}

function OverviewPanel({ a, membership }: { a: AssociationDetail; membership: AssociationMembership | null | undefined }) {
  const { showToast, viewProfile } = useUiStore()
  const canAddEvent = membership?.memberRole === 'PRESIDENT' || membership?.memberRole === 'SECRETARY'
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [viewingEventId, setViewingEventId] = useState<string | null>(null)
  return (
    <div className="comm-tab-panel active" id="comm-tab-overview" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Upcoming Events</h2>
        {canAddEvent && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateEvent(true)}>Add Event</button>
        )}
      </div>
      {a.events?.length ? (
        a.events.map((ev) => (
          <button key={ev.id} type="button" className="comm-card" style={{ margin: '0 0 var(--space-2)', display: 'block' }} onClick={() => setViewingEventId(ev.id)}>
            <div className="comm-card-name">{ev.title}</div>
            <div className="comm-card-meta"><span>📅 {fmtDate(ev.startsAt)}</span></div>
          </button>
        ))
      ) : (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No upcoming events.</p>
      )}
      {showCreateEvent && (
        <CreateEventModal associationId={a.id} onClose={() => setShowCreateEvent(false)} />
      )}
      {viewingEventId && (
        <EventDetailById eventId={viewingEventId} onClose={() => setViewingEventId(null)} onOpenProfile={(id) => { setViewingEventId(null); viewProfile(id) }} />
      )}

      <h2 className="section-title" style={{ margin: 'var(--space-4) 0 var(--space-3)' }}>Members</h2>
      {a.members?.length ? (
        <div className="comm-member-list" style={{ margin: 0, padding: 0 }}>
          {a.members.map((m) => {
            const u = m.user
            return (
              <button key={u.id} type="button" className="comm-member-item" onClick={() => viewProfile(u.id)}>
                <div className="avatar-sm">
                  {u.profilePhoto
                    ? <img src={u.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : (u.displayName || '?').charAt(0).toUpperCase()
                  }
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{u.displayName || 'Unknown'}</div>
                <span className="comm-member-role">{m.memberRole || 'MEMBER'}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No members yet.</p>
      )}
    </div>
  )
}

function LearningPanel({ assocId, loaded }: { assocId: string; loaded: boolean }) {
  const { token } = useAuthStore()
  const isMember = false // already checked in parent
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useCommunityLearning(assocId)

  useEffect(() => {
    if (loaded) refetch()
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || isLoading) return <div style={{ padding: 'var(--space-4)' }}><div className="spinner-center"><div className="spinner" /></div></div>
  if (error) return <p style={{ padding: 'var(--space-4)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Could not load learning content.</p>

  const { courses = [], resources = [] } = data ?? {}
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null)

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {!courses.length && !resources.length && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No content yet.</p>
      )}
      {courses.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Courses</h2>
          {courses.map((c) => <CourseCard key={c.id} c={c} onOpen={() => setViewingCourseId(c.id)} />)}
        </>
      )}
      {resources.length > 0 && (
        <>
          <h2 className="section-title" style={{ margin: 'var(--space-4) 0 var(--space-3)' }}>Resources</h2>
          {resources.map((r) => <ResourceCard key={r.id} r={r} />)}
        </>
      )}
      {viewingCourseId && (
        <CourseDetailPanel courseId={viewingCourseId} onClose={() => setViewingCourseId(null)} />
      )}
    </div>
  )
}

function ProjectsPanel({ assocId, loaded }: { assocId: string; loaded: boolean }) {
  const { data, isLoading, error, refetch } = useCommunityProjects(assocId)
  useEffect(() => { if (loaded) refetch() }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null)
  if (!loaded || isLoading) return <div style={{ padding: 'var(--space-4)' }}><div className="spinner-center"><div className="spinner" /></div></div>
  if (error) return <p style={{ padding: 'var(--space-4)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Could not load projects.</p>
  const projects = data ?? []
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {!projects.length
        ? <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No projects yet.</p>
        : projects.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => setViewingProjectId(p.id)} />)
      }
      {viewingProjectId && (
        <ProjectDetailPanel projectId={viewingProjectId} onClose={() => setViewingProjectId(null)} />
      )}
    </div>
  )
}

function CirclesPanel({ assocId, loaded }: { assocId: string; loaded: boolean }) {
  const { token } = useAuthStore()
  const { data, isLoading, error, refetch } = useCommunityCircles(assocId)
  useEffect(() => { if (loaded) refetch() }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps
  const [viewingCircleId, setViewingCircleId] = useState<string | null>(null)
  const [showCreateCircle, setShowCreateCircle] = useState(false)

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {token && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateCircle(true)}>
            <i className="fa-solid fa-plus" style={{ marginRight: 4 }} />New Circle
          </button>
        </div>
      )}

      {(!loaded || isLoading) && <div className="spinner-center"><div className="spinner" /></div>}
      {loaded && !isLoading && error && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Could not load circles.</p>}
      {loaded && !isLoading && !error && (
        (data ?? []).length === 0
          ? <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No study circles yet.</p>
          : (data ?? []).map((c) => <CircleCard key={c.id} c={c} onOpen={() => setViewingCircleId(c.id)} />)
      )}

      {viewingCircleId && (
        <CircleDetailPanel circleId={viewingCircleId} onClose={() => setViewingCircleId(null)} />
      )}
      {showCreateCircle && (
        <CreateCircleModal associationId={assocId} onClose={() => setShowCreateCircle(false)} onCreated={() => refetch()} />
      )}
    </div>
  )
}

function ContributionsPanel() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No contributions yet.</p>
    </div>
  )
}

// ── Sub-cards ─────────────────────────────────────────────────

function CourseCard({ c, onOpen }: { c: CommunityCourse; onOpen: () => void }) {
  const lessonCount = c._count?.lessons ?? 0
  const instructor = c.instructor?.displayName || 'Community'
  const tradColors: Record<string, { grad: string; icon: string }> = {
    THERAVADA: { grad: 'linear-gradient(135deg,#b45309,#92400e)', icon: 'fa-dharmachakra' },
    MAHAYANA:  { grad: 'linear-gradient(135deg,#f59e0b,#f97316)', icon: 'fa-yin-yang' },
    VAJRAYANA: { grad: 'linear-gradient(135deg,#a855f7,#4f46e5)', icon: 'fa-bell' },
  }
  const tc = tradColors[c.tradition ?? ''] ?? { grad: 'linear-gradient(135deg,#2563EB,#1d4ed8)', icon: 'fa-book-open' }

  return (
    <button type="button" className="course-card" onClick={onOpen}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: tc.grad, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <i className={`fa-solid ${tc.icon} text-xl`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {c.tradition && <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#2563EB' }}>{c.tradition}</span>}
            <h3 className="font-semibold text-sangham-ink text-sm mt-0.5 leading-snug">{c.title}</h3>
            <p className="text-xs text-sangham-brown-light mt-0.5">{instructor}</p>
          </div>
          <span className="text-xs text-sangham-brown-light flex-shrink-0 mt-0.5">{lessonCount} lesson{lessonCount !== 1 ? 's' : ''}</span>
        </div>
        {c.description && <p className="text-xs text-sangham-brown-light mt-2 line-clamp-1 leading-relaxed">{c.description.slice(0, 100)}</p>}
        <div className="flex items-center gap-3 mt-3">
          <div className="px-4 text-white text-xs font-semibold rounded-xl" style={{ background: '#8B6621', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>
            Start Course
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{(c.language ?? 'en').toUpperCase()}</span>
        </div>
      </div>
    </button>
  )
}

function ResourceCard({ r }: { r: CommunityResource }) {
  const FA_ICONS: Record<string, string> = { YOUTUBE_VIDEO: 'fa-video', YOUTUBE_PLAYLIST: 'fa-list', PDF: 'fa-file-pdf', ARTICLE: 'fa-newspaper', RESEARCH_PAPER: 'fa-microscope', WORKSHOP_RECORDING: 'fa-headphones', GUIDE: 'fa-book-open', BOOK_SUMMARY: 'fa-bookmark' }
  const FA_COLORS: Record<string, { bg: string; clr: string }> = { YOUTUBE_VIDEO: { bg: '#f5f3ff', clr: '#7c3aed' }, PDF: { bg: '#fef2f2', clr: '#ef4444' }, ARTICLE: { bg: '#fffbeb', clr: '#f59e0b' }, RESEARCH_PAPER: { bg: '#eff6ff', clr: '#3b82f6' }, WORKSHOP_RECORDING: { bg: '#f0fdf4', clr: '#22c55e' }, GUIDE: { bg: '#fff7ed', clr: '#f97316' } }
  const icon = FA_ICONS[r.type] || 'fa-paperclip'
  const clrs = FA_COLORS[r.type] || { bg: '#F8F5EF', clr: '#C79A3B' }
  const dur = r.durationSecs ? `${Math.round(r.durationSecs / 60)}m · ` : ''
  const typeLabel = (r.type || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  const isPlayable = r.type?.includes('VIDEO') || r.type === 'WORKSHOP_RECORDING'

  return (
    <button type="button" className="resource-card" onClick={() => window.open(r.url, '_blank', 'noopener')}>
      {r.thumbnailUrl
        ? <img src={r.thumbnailUrl} alt="" loading="lazy" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: clrs.bg, color: clrs.clr }}><i className={`fa-solid ${icon} text-lg`} /></div>
      }
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sangham-ink text-sm truncate">{r.title}</h4>
        <p className="text-xs text-sangham-brown-light mt-0.5">{typeLabel}{r.creator ? ' · ' + r.creator : ''}{dur ? ' · ' + dur : ''}{(r.language ?? 'en').toUpperCase()}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-sangham-cream flex items-center justify-center text-sangham-brown-light flex-shrink-0">
        <i className={`fa-solid ${isPlayable ? 'fa-play' : 'fa-download'} text-sm`} />
      </div>
    </button>
  )
}

function ProjectCard({ p, onOpen }: { p: CommunityProject; onOpen: () => void }) {
  const memberCount = p._count?.members ?? 0
  return (
    <button type="button" className="comm-card" onClick={onOpen}>
      <div className="comm-card-name">{p.icon || '🤝'} {p.title}</div>
      <div className="comm-card-meta"><span>{memberCount} collaborators</span><span>{p.status || 'OPEN'}</span></div>
      {p.purpose && <div className="comm-card-desc">{p.purpose}</div>}
    </button>
  )
}

function CircleCard({ c, onOpen }: { c: CommunityCircle; onOpen: () => void }) {
  const memberCount = c._count?.members ?? 0
  const statusColors: Record<string, { bg: string; clr: string }> = { OPEN: { bg: '#f0fdf4', clr: '#16a34a' }, ACTIVE: { bg: '#eff6ff', clr: '#2563eb' }, CLOSED: { bg: '#f9fafb', clr: '#9ca3af' } }
  const sc = statusColors[c.status] || statusColors.OPEN

  return (
    <button type="button" className="circle-card" onClick={onOpen}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#2563EB,#1d4ed8)' }}>
          <i className="fa-solid fa-users text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sangham-ink text-sm leading-snug">{c.topic}</h4>
          <p className="text-xs text-sangham-brown-light mt-0.5">{memberCount} members{c.scheduleDescription ? ' · ' + c.scheduleDescription : ''}</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md flex-shrink-0" style={{ background: sc.bg, color: sc.clr }}>{c.status || 'OPEN'}</span>
      </div>
      {c.description && (
        <p className="text-xs text-sangham-brown-light leading-relaxed mb-3">{c.description.slice(0, 110)}{c.description.length > 110 ? '…' : ''}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-sangham-brown-light">By {c.facilitator?.displayName || 'Unknown'}</span>
        <div className="px-4 text-white text-xs font-semibold rounded-lg" style={{ background: '#8B6621', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>
          Join
        </div>
      </div>
    </button>
  )
}

// ── Main CommunityDetail component ────────────────────────────

interface Props {
  assocId: string
  onClose: () => void
}

export function CommunityDetail({ assocId, onClose }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [loadedTabs, setLoadedTabs] = useState<Set<DetailTab>>(new Set(['overview']))
  const [joining, setJoining] = useState(false)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [managingMembers, setManagingMembers] = useState(false)

  const { data: assoc, isLoading: assocLoading } = useAssociation(assocId)
  const { data: membership } = useAssociationMembership(assocId)
  const joinMut = useJoinAssociation()
  const leaveMut = useLeaveAssociation()

  const isMember = membership?.isMember ?? false
  const isPresident = membership?.memberRole === 'PRESIDENT'

  const switchTab = (tab: DetailTab) => {
    setActiveTab(tab)
    setLoadedTabs((prev) => new Set([...prev, tab]))
  }

  const handleToggleMembership = async () => {
    if (!token) { showToast('Sign in to join communities', 'info'); return }
    if (isPresident) return

    if (isMember && !confirmingLeave) {
      setConfirmingLeave(true)
      setTimeout(() => setConfirmingLeave(false), 4000)
      return
    }

    setJoining(true)
    setConfirmingLeave(false)
    try {
      if (isMember) {
        await leaveMut.mutateAsync(assocId)
        showToast('Left ' + (assoc?.name ?? 'community'), 'success')
      } else {
        await joinMut.mutateAsync(assocId)
        showToast('Joined ' + (assoc?.name ?? 'community'), 'success')
        if (navigator.vibrate) navigator.vibrate(15)
      }
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setJoining(false)
    }
  }

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'learning', label: 'Learning' },
    { id: 'projects', label: 'Projects' },
    { id: 'circles', label: 'Circles' },
    { id: 'contributions', label: 'Contributions' },
  ]

  return (
    <div className="panel-comm">
      {/* Header */}
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Go back">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="panel-title">{assoc?.name ?? 'Community'}</div>
        {token && isPresident && !assocLoading && (
          <button className="btn btn-ghost btn-sm" onClick={() => setManagingMembers(true)}>
            <i className="fa-solid fa-users-gear" style={{ marginRight: 4 }} /> Manage
          </button>
        )}
        {token && !isPresident && !assocLoading && (
          <button
            className={`btn btn-sm ${isMember ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleToggleMembership}
            disabled={joining}
          >
            {isMember ? (confirmingLeave ? 'Confirm Leave?' : 'Leave') : 'Join'}
          </button>
        )}
      </div>

      {/* Panel content */}
      <div className="panel-content">
        {assocLoading ? (
          <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : assoc ? (
          <>
            {/* Cover */}
            <div className="comm-detail-cover" style={{ background: tradGrad(assoc.tradition) }}>
              {tradIcon(assoc.tradition)}
            </div>

            {/* Info */}
            <div className="comm-detail-info">
              <div className="comm-detail-name">{assoc.name}</div>
              <div className="comm-detail-meta">
                {assoc.tradition && <span>{assoc.tradition.replace('_', ' ')}</span>}
                {assoc.category && <span>{assoc.category.replace(/_/g, ' ')}</span>}
                {(assoc.city || assoc.country) && <span>{assoc.city || ''}{assoc.country ? (assoc.city ? ', ' : '') + assoc.country : ''}</span>}
                <span>{assoc._count?.members ?? 0} members</span>
                {assoc.website && (
                  <a href={assoc.website.startsWith('http') ? assoc.website : `https://${assoc.website}`} target="_blank" rel="noopener" style={{ color: 'var(--saffron-600)' }}>
                    {assoc.website}
                  </a>
                )}
              </div>
              {assoc.description && <div className="comm-detail-desc">{assoc.description}</div>}
            </div>

            {/* Sub-tabs */}
            <div className="comm-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`comm-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => switchTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className={`comm-tab-panel${activeTab === 'overview' ? ' active' : ''}`} style={{ padding: 0 }}>
              <OverviewPanel a={assoc} membership={membership} />
            </div>
            <div className={`comm-tab-panel${activeTab === 'learning' ? ' active' : ''}`}>
              <LearningPanel assocId={assocId} loaded={loadedTabs.has('learning')} />
            </div>
            <div className={`comm-tab-panel${activeTab === 'projects' ? ' active' : ''}`}>
              <ProjectsPanel assocId={assocId} loaded={loadedTabs.has('projects')} />
            </div>
            <div className={`comm-tab-panel${activeTab === 'circles' ? ' active' : ''}`}>
              <CirclesPanel assocId={assocId} loaded={loadedTabs.has('circles')} />
            </div>
            <div className={`comm-tab-panel${activeTab === 'contributions' ? ' active' : ''}`}>
              <ContributionsPanel />
            </div>
          </>
        ) : (
          <p style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            Could not load community.
          </p>
        )}
      </div>
      {managingMembers && (
        <MemberManagementPanel assocId={assocId} onClose={() => setManagingMembers(false)} />
      )}
    </div>
  )
}
