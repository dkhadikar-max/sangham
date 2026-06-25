'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import {
  useEducatePaths,
  useMyEnrollments,
  useReputation,
  useEnrollPath,
  useMarkLesson,
  useAITutor,
  type EducatePath,
  type EducateEnrollment,
  type EducateLesson,
} from '@/hooks/useEducate'

const DOMAIN_META: Record<string, { icon: string; label: string }> = {
  AI_AUTOMATION:       { icon: '🤖', label: 'AI & Automation' },
  ENTREPRENEURSHIP:    { icon: '🚀', label: 'Entrepreneurship' },
  SALES:               { icon: '💼', label: 'Sales' },
  LEADERSHIP:          { icon: '🎯', label: 'Leadership' },
  NETWORKING:          { icon: '🌐', label: 'Networking' },
  WEALTH_FUNDAMENTALS: { icon: '💰', label: 'Wealth' },
  BUDDHISM_MEDITATION: { icon: '🧘', label: 'Dharma' },
}

const LEVEL_META: Record<string, { icon: string; label: string }> = {
  EXPLORER:     { icon: '🌱', label: 'Explorer' },
  LEARNER:      { icon: '📚', label: 'Learner' },
  PRACTITIONER: { icon: '⚡', label: 'Practitioner' },
  CONTRIBUTOR:  { icon: '🌟', label: 'Contributor' },
  MENTOR:       { icon: '🎓', label: 'Mentor' },
}

function pathTotalLessons(path: EducatePath): number {
  return path.phases.reduce((sum, ph) => sum + ph.lessons.length, 0)
}

// ── AI Tutor ──────────────────────────────────────────────────────────────────

interface AITutorProps {
  path: EducatePath
  phaseIdx: number
  lessonIdx: number
  lesson: EducateLesson
  enrollment: EducateEnrollment | null
}

function AITutor({ path, phaseIdx, lessonIdx, lesson, enrollment }: AITutorProps) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const aiTutor = useAITutor()
  const [result, setResult] = useState<{ action: string; text: string } | null>(null)
  const [question, setQuestion] = useState('')

  const ACTIONS = [
    { key: 'explain',   icon: '💡', label: 'Explain',  desc: 'Plain-language breakdown' },
    { key: 'quiz',      icon: '❓', label: 'Quiz',     desc: '3 questions + answers' },
    { key: 'summarize', icon: '📋', label: 'Summary',  desc: '5 key bullet points' },
    { key: 'exercise',  icon: '🎯', label: 'Exercise', desc: '24-hour action task' },
  ] as const

  const call = async (action: 'explain' | 'quiz' | 'summarize' | 'exercise' | 'simplify') => {
    if (!token) { showToast('Sign in to use AI Tutor', 'info'); return }
    setResult({ action, text: '' })
    try {
      const res = await aiTutor.mutateAsync({
        action,
        pathSlug: path.slug,
        phaseIndex: phaseIdx,
        lessonIndex: lessonIdx,
        lessonTitle: lesson.title,
        concepts: lesson.concepts,
        userQuestion: action === 'simplify' ? question : undefined,
        completedLessons: enrollment?.lessonProgress.map(lp => lp.lessonKey) ?? [],
        percentComplete: enrollment?.percentComplete ?? 0,
      })
      setResult({ action, text: res.response })
    } catch {
      setResult({ action, text: 'AI Tutor is temporarily unavailable. Please try again.' })
    }
  }

  return (
    <div style={{ marginTop: 'var(--space-4)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', border: '1px solid rgba(199,154,59,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>AI Tutor</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--saffron-700)', background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 4, padding: '1px 5px' }}>BETA</span>
      </div>

      {/* 4 action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        {ACTIONS.map(({ key, icon, label, desc }) => (
          <button
            key={key}
            onClick={() => call(key)}
            disabled={aiTutor.isPending}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
              padding: '10px 12px', background: 'white', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit', opacity: aiTutor.isPending ? 0.6 : 1, transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>{desc}</span>
          </button>
        ))}
      </div>

      {/* Ask AI free text */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && question.trim()) call('simplify') }}
          placeholder="Ask anything about this lesson…"
          style={{
            flex: 1, padding: '10px 12px', fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)',
            background: 'white', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={() => question.trim() && call('simplify')}
          disabled={!question.trim() || aiTutor.isPending}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0 }}
        >
          Ask
        </button>
      </div>

      {/* Loading + response */}
      {aiTutor.isPending && !result?.text && (
        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          <div className="spinner" />
        </div>
      )}
      {result && (
        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)',
          border: '1px solid var(--border-subtle)', fontSize: 'var(--text-sm)', lineHeight: 1.75,
          color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
        }}>
          {result.text || <span style={{ color: 'var(--text-tertiary)' }}>Generating…</span>}
        </div>
      )}
    </div>
  )
}

// ── Path detail ───────────────────────────────────────────────────────────────

interface PathDetailProps {
  path: EducatePath
  enrollment: EducateEnrollment | null
  onBack: () => void
  onEnroll: () => void
  enrolling: boolean
}

function PathDetail({ path, enrollment, onBack, onEnroll, enrolling }: PathDetailProps) {
  const { token } = useAuthStore()
  const markLesson = useMarkLesson()
  const dm = DOMAIN_META[path.domain] ?? { icon: '📚', label: path.domain }
  const completedKeys = new Set(enrollment?.lessonProgress.map(lp => lp.lessonKey) ?? [])
  const [expandedLesson, setExpandedLesson] = useState<{ phase: number; lesson: number } | null>(
    enrollment ? { phase: enrollment.currentPhase, lesson: enrollment.currentLesson } : null,
  )

  const isExpanded = (pi: number, li: number) =>
    expandedLesson?.phase === pi && expandedLesson?.lesson === li

  const handleMark = async (pi: number, li: number) => {
    if (!enrollment) return
    await markLesson.mutateAsync({ enrollmentId: enrollment.id, lessonKey: `${pi}.${li}` })
  }

  return (
    <div style={{ padding: '0 var(--space-4) var(--space-8)' }}>
      {/* Back */}
      <div style={{ padding: 'var(--space-3) 0' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontFamily: 'inherit', padding: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All Paths
        </button>
      </div>

      {/* Header card */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-1)', overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--saffron-400), var(--saffron-600))' }} />
        <div style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 600, color: 'var(--saffron-700)', marginBottom: 'var(--space-2)' }}>
            <span>{dm.icon}</span>
            <span>{dm.label}</span>
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.2 }}>{path.title}</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>{path.description}</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{path.phases.length}</strong> phases</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{pathTotalLessons(path)}</strong> lessons</span>
            {enrollment && (
              <span><strong style={{ color: 'var(--saffron-600)' }}>{Math.round(enrollment.percentComplete)}%</strong> complete</span>
            )}
          </div>

          {enrollment ? (
            <>
              <div style={{ background: 'var(--surface-sunken)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--saffron-400), var(--saffron-600))', width: `${enrollment.percentComplete}%`, transition: 'width 0.4s' }} />
              </div>
              {enrollment.streak > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>🔥 {enrollment.streak}-day streak</div>
              )}
            </>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={onEnroll}
              disabled={!token || enrolling}
            >
              {!token ? 'Sign in to Start' : enrolling ? 'Enrolling…' : 'Start Learning'}
            </button>
          )}
        </div>
      </div>

      {/* Phases */}
      {path.phases.map((phase, pi) => (
        <div key={pi} style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--saffron-500)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {pi + 1}
            </div>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{phase.title}</span>
          </div>

          {phase.lessons.map((lesson, li) => {
            const key = `${pi}.${li}`
            const done = completedKeys.has(key)
            const expanded = isExpanded(pi, li)
            const isCurrent = !!enrollment && enrollment.currentPhase === pi && enrollment.currentLesson === li && !done

            return (
              <div
                key={li}
                style={{
                  background: 'white', borderRadius: 'var(--radius-xl)',
                  border: `1px solid ${isCurrent ? 'var(--saffron-400)' : done ? 'rgba(16,185,129,0.35)' : 'var(--border-default)'}`,
                  marginBottom: 'var(--space-2)', overflow: 'hidden',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(199,154,59,0.12)' : 'none',
                }}
              >
                <button
                  onClick={() => setExpandedLesson(expanded ? null : { phase: pi, lesson: li })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#10b981' : isCurrent ? 'var(--saffron-500)' : 'var(--surface-sunken)',
                    border: done || isCurrent ? 'none' : '2px solid var(--border-default)',
                  }}>
                    {done
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12" /></svg>
                      : <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? 'white' : 'var(--text-tertiary)' }}>{li + 1}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {lesson.title}
                      {isCurrent && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--saffron-600)', background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 4, padding: '1px 5px' }}>CURRENT</span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{lesson.duration} min</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, color: 'var(--text-tertiary)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {expanded && (
                  <div style={{ padding: '0 var(--space-4) var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      {lesson.overview}
                    </p>

                    {/* Key concepts */}
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>Key Concepts</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lesson.concepts.map((c, ci) => (
                          <span key={ci} style={{ fontSize: 11, background: 'var(--surface-sunken)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '2px 8px', color: 'var(--text-secondary)' }}>{c}</span>
                        ))}
                      </div>
                    </div>

                    {/* Action task */}
                    <div style={{ background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--saffron-700)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✅ Action Task</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>{lesson.actionTask}</div>
                    </div>

                    {/* Reflection */}
                    <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💭 Reflection</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>{lesson.reflection}</div>
                    </div>

                    {/* Mark complete */}
                    {enrollment && !done && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginBottom: 'var(--space-3)' }}
                        onClick={() => handleMark(pi, li)}
                        disabled={markLesson.isPending}
                      >
                        {markLesson.isPending ? 'Saving…' : '✓ Mark Complete'}
                      </button>
                    )}
                    {done && (
                      <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: '#10b981', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                        ✓ Completed
                      </div>
                    )}

                    {/* AI Tutor — always visible once lesson is open */}
                    <AITutor path={path} phaseIdx={pi} lessonIdx={li} lesson={lesson} enrollment={enrollment} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Path card ─────────────────────────────────────────────────────────────────

function PathCard({ path, enrollment, onSelect }: { path: EducatePath; enrollment: EducateEnrollment | null; onSelect: () => void }) {
  const dm = DOMAIN_META[path.domain] ?? { icon: '📚', label: path.domain }

  return (
    <button
      onClick={onSelect}
      style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-1)', overflow: 'hidden', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', padding: 0 }}
    >
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--saffron-400), var(--saffron-600))' }} />
      <div style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-2)' }}>
          <span style={{ fontSize: 20 }}>{dm.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--saffron-700)', background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>{dm.label}</span>
        </div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{path.title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{path.tagline}</div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: enrollment ? 'var(--space-2)' : 0 }}>
          <span>{path.phases.length} phases · {pathTotalLessons(path)} lessons</span>
        </div>
        {enrollment && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>
              <span>Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--saffron-600)' }}>{Math.round(enrollment.percentComplete)}%</span>
            </div>
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--saffron-400), var(--saffron-600))', width: `${enrollment.percentComplete}%` }} />
            </div>
          </>
        )}
      </div>
    </button>
  )
}

// ── Main CoursesView ──────────────────────────────────────────────────────────

export function CoursesView({ searchQuery }: { searchQuery: string }) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const { data: paths = [], isLoading } = useEducatePaths()
  const { data: myEnrollments = [] } = useMyEnrollments()
  const { data: reputation } = useReputation()
  const enroll = useEnrollPath()
  const [selectedPath, setSelectedPath] = useState<EducatePath | null>(null)

  const enrollmentByPathId = new Map(myEnrollments.map(e => [e.pathId, e]))

  const filtered = searchQuery
    ? paths.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (DOMAIN_META[p.domain]?.label ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : paths

  const myPaths = filtered.filter(p => enrollmentByPathId.has(p.id))
  const explorePaths = filtered.filter(p => !enrollmentByPathId.has(p.id))

  const handleEnroll = async (path: EducatePath) => {
    if (!token) { showToast('Sign in to enroll in a learning path', 'info'); return }
    try {
      await enroll.mutateAsync(path.slug)
      showToast('Enrolled! Open the path to start your first lesson.', 'success')
    } catch {
      showToast('Could not enroll — please try again', 'error')
    }
  }

  if (selectedPath) {
    return (
      <PathDetail
        path={selectedPath}
        enrollment={enrollmentByPathId.get(selectedPath.id) ?? null}
        onBack={() => setSelectedPath(null)}
        onEnroll={() => handleEnroll(selectedPath)}
        enrolling={enroll.isPending}
      />
    )
  }

  return (
    <div style={{ padding: '0 var(--space-4) var(--space-8)' }}>
      {/* Reputation badge */}
      {reputation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-1)', marginTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: 24 }}>{LEVEL_META[reputation.level]?.icon ?? '🌱'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{LEVEL_META[reputation.level]?.label ?? reputation.level}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {reputation.totalLessons} lessons · {reputation.totalPaths} paths completed
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
          <div className="spinner spinner-lg" />
        </div>
      )}

      {!isLoading && paths.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📚</div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No learning paths yet</p>
          <p style={{ fontSize: 'var(--text-xs)' }}>Learning paths will appear here once they are added.</p>
        </div>
      )}

      {!isLoading && paths.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🔍</div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>No paths match "{searchQuery}"</p>
        </div>
      )}

      {/* My paths — enrolled */}
      {myPaths.length > 0 && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Continue Learning</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {myPaths.map(p => (
              <PathCard key={p.id} path={p} enrollment={enrollmentByPathId.get(p.id) ?? null} onSelect={() => setSelectedPath(p)} />
            ))}
          </div>
        </div>
      )}

      {/* All other paths */}
      {explorePaths.length > 0 && (
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            {myPaths.length > 0 ? 'Explore More Paths' : 'Learning Paths'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {explorePaths.map(p => (
              <PathCard key={p.id} path={p} enrollment={null} onSelect={() => setSelectedPath(p)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
