'use client'

import { useState } from 'react'
import { useCourseDetail, useEnrollCourse, useUnenrollCourse, useAddLesson, useSetCourseStatus } from '@/hooks/useCourseDetail'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { DiscussionThread } from '@/components/discussion/DiscussionThread'

interface Props {
  courseId: string
  onClose: () => void
}

function fmtDuration(secs: number | null) {
  if (!secs) return null
  const mins = Math.round(secs / 60)
  return `${mins} min`
}

export function CourseDetailPanel({ courseId, onClose }: Props) {
  const { token } = useAuthStore()
  const { showToast, viewProfile } = useUiStore()
  const { data: course, isLoading } = useCourseDetail(courseId)
  const enroll = useEnrollCourse()
  const unenroll = useUnenrollCourse()
  const addLesson = useAddLesson()
  const setStatus = useSetCourseStatus()
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')

  function handleToggleEnroll() {
    if (!token) { showToast('Sign in to enroll', 'info'); return }
    if (!course) return
    if (course.isEnrolled) {
      unenroll.mutate(courseId, { onSuccess: () => showToast('Unenrolled', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    } else {
      enroll.mutate(courseId, { onSuccess: () => showToast('Enrolled!', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    }
  }

  function handleAddLesson() {
    if (!lessonTitle.trim()) { showToast('Lesson title is required', 'error'); return }
    addLesson.mutate({ courseId, title: lessonTitle.trim(), content: lessonContent.trim() || undefined }, {
      onSuccess: () => {
        showToast('Lesson added', 'success')
        setLessonTitle('')
        setLessonContent('')
        setShowAddLesson(false)
      },
      onError: (e) => showToast((e as Error).message || 'Failed to add lesson', 'error'),
    })
  }

  function handleToggleStatus() {
    if (!course) return
    const nextStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    setStatus.mutate({ id: courseId, status: nextStatus }, {
      onSuccess: () => showToast(nextStatus === 'PUBLISHED' ? 'Course published' : 'Course unpublished', 'success'),
      onError: (e) => showToast((e as Error).message || 'Failed to update status', 'error'),
    })
  }

  return (
    <div className="panel-comm" style={{ zIndex: 55 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Course</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        )}

        {course && (
          <div style={{ padding: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{course.title}</h2>

            {course.instructor && (
              <button
                onClick={() => viewProfile(course.instructor!.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 'var(--space-3)' }}
              >
                <div className="avatar-sm">
                  {course.instructor.profilePhoto
                    ? <img src={course.instructor.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : course.instructor.displayName.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{course.instructor.displayName}</span>
              </button>
            )}

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
              {course._count.lessons} lessons · {course._count.enrollments} enrolled{course.language ? ` · ${course.language.toUpperCase()}` : ''}
            </div>

            {course.isInstructor ? (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Status
                </label>
                <button
                  className={`btn ${course.status === 'PUBLISHED' ? 'btn-ghost' : 'btn-primary'}`}
                  style={{ width: '100%' }}
                  onClick={handleToggleStatus}
                  disabled={setStatus.isPending}
                >
                  {course.status === 'PUBLISHED' ? 'Unpublish (revert to draft)' : 'Publish Course'}
                </button>
              </div>
            ) : (
              <button
                className={`btn ${course.isEnrolled ? 'btn-ghost' : 'btn-primary'}`}
                style={{ width: '100%', marginBottom: 'var(--space-4)' }}
                onClick={handleToggleEnroll}
                disabled={enroll.isPending || unenroll.isPending}
              >
                {course.isEnrolled ? 'Unenroll' : 'Enroll'}
              </button>
            )}

            {course.description && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>{course.description}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <div className="section-title" style={{ padding: 0 }}>Lessons</div>
              {course.isInstructor && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddLesson((v) => !v)}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 4 }} />Add Lesson
                </button>
              )}
            </div>

            {showAddLesson && (
              <div style={{ padding: 'var(--space-3)', background: 'var(--surface-bg)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }}>
                <input
                  className="input"
                  placeholder="Lesson title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  style={{ marginBottom: 'var(--space-2)' }}
                  maxLength={200}
                />
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Lesson content (optional)"
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  style={{ marginBottom: 'var(--space-2)' }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddLesson} disabled={addLesson.isPending || !lessonTitle.trim()}>
                  {addLesson.isPending ? <span className="spinner spinner-sm" /> : 'Add'}
                </button>
              </div>
            )}

            {course.lessons.length === 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No lessons published yet.</p>
            )}
            {course.lessons.map((lesson, i) => {
              const label = lesson.resource?.title ?? lesson.title
              const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'inherit' }
              const inner = (
                <>
                  <span style={{ width: 24, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>
                  {lesson.resource?.durationSecs != null && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{fmtDuration(lesson.resource.durationSecs)}</span>
                  )}
                </>
              )
              return lesson.resource
                ? <a key={lesson.id} href={lesson.resource.url} target="_blank" rel="noopener" style={rowStyle}>{inner}</a>
                : <div key={lesson.id} style={rowStyle}>{inner}</div>
            })}

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <DiscussionThread entityType="course" entityId={courseId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
