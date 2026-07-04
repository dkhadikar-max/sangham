'use client'

import { useCourseDetail, useEnrollCourse, useUnenrollCourse } from '@/hooks/useCourseDetail'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

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

  function handleToggleEnroll() {
    if (!token) { showToast('Sign in to enroll', 'info'); return }
    if (!course) return
    if (course.isEnrolled) {
      unenroll.mutate(courseId, { onSuccess: () => showToast('Unenrolled', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    } else {
      enroll.mutate(courseId, { onSuccess: () => showToast('Enrolled!', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    }
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

            <button
              className={`btn ${course.isEnrolled ? 'btn-ghost' : 'btn-primary'}`}
              style={{ width: '100%', marginBottom: 'var(--space-4)' }}
              onClick={handleToggleEnroll}
              disabled={enroll.isPending || unenroll.isPending}
            >
              {course.isEnrolled ? 'Unenroll' : 'Enroll'}
            </button>

            {course.description && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>{course.description}</p>
            )}

            <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Lessons</div>
            {course.lessons.length === 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No lessons published yet.</p>
            )}
            {course.lessons.map((lesson, i) => (
              <a
                key={lesson.id}
                href={lesson.resource?.url}
                target="_blank"
                rel="noopener"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'inherit' }}
              >
                <span style={{ width: 24, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{lesson.resource?.title ?? 'Untitled lesson'}</span>
                {lesson.resource?.durationSecs != null && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{fmtDuration(lesson.resource.durationSecs)}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
