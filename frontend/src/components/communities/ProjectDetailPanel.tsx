'use client'

import { useProjectDetail, useJoinProject, useLeaveProject, useSetProjectStatus } from '@/hooks/useProjectDetail'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { DiscussionThread } from '@/components/discussion/DiscussionThread'

interface Props {
  projectId: string
  onClose: () => void
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function ProjectDetailPanel({ projectId, onClose }: Props) {
  const { token } = useAuthStore()
  const { showToast, viewProfile } = useUiStore()
  const { data: project, isLoading } = useProjectDetail(projectId)
  const join = useJoinProject()
  const leave = useLeaveProject()
  const setStatus = useSetProjectStatus()

  function handleStatusChange(status: 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
    setStatus.mutate({ id: projectId, status }, {
      onSuccess: () => showToast('Project status updated', 'success'),
      onError: (e) => showToast((e as Error).message || 'Failed to update status', 'error'),
    })
  }

  function handleToggleJoin() {
    if (!token) { showToast('Sign in to join projects', 'info'); return }
    if (!project) return
    if (project.isMember) {
      leave.mutate(projectId, { onSuccess: () => showToast('Left project', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    } else {
      join.mutate(projectId, { onSuccess: () => showToast('Joined project!', 'success'), onError: (e) => showToast((e as Error).message, 'error') })
    }
  }

  if (!token) {
    return (
      <div className="panel-comm" style={{ zIndex: 55 }}>
        <div className="panel-header">
          <button className="panel-back" onClick={onClose} aria-label="Close"><i className="fa-solid fa-arrow-left" /></button>
          <span className="panel-title">Project</span>
        </div>
        <p style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Sign in to view project details.</p>
      </div>
    )
  }

  return (
    <div className="panel-comm" style={{ zIndex: 55 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Project</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        )}

        {project && (
          <div style={{ padding: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              {project.icon ?? '🤝'} {project.title}
            </h2>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              {project._count.members} collaborators · {project.status}
            </div>

            {project.isOwner ? (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Status
                </label>
                <select
                  className="input"
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED')}
                  disabled={setStatus.isPending}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="OPEN">Open</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            ) : (
              <button
                className={`btn ${project.isMember ? 'btn-ghost' : 'btn-primary'}`}
                style={{ width: '100%', marginBottom: 'var(--space-4)' }}
                onClick={handleToggleJoin}
                disabled={join.isPending || leave.isPending}
              >
                {project.isMember ? 'Leave Project' : 'Join Project'}
              </button>
            )}

            {project.purpose && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Purpose</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{project.purpose}</p>
              </div>
            )}

            {project.description && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Description</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{project.description}</p>
              </div>
            )}

            {project.skillsNeeded?.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Skills Needed</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {project.skillsNeeded.map((s) => (
                    <span key={s} className="profile-tradition-tag">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Owner</div>
            <button
              onClick={() => viewProfile(project.owner.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 'var(--space-4)' }}
            >
              <div className="avatar-sm">
                {project.owner.profilePhoto
                  ? <img src={project.owner.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : initials(project.owner.displayName)}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>{project.owner.displayName}</span>
            </button>

            {project.members.length > 0 && (
              <>
                <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Collaborators</div>
                {project.members.map((m) => (
                  <button
                    key={m.user.id}
                    onClick={() => viewProfile(m.user.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-2) 0', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  >
                    <div className="avatar-sm">
                      {m.user.profilePhoto
                        ? <img src={m.user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : initials(m.user.displayName)}
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{m.user.displayName}</span>
                  </button>
                ))}
              </>
            )}

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <DiscussionThread entityType="project" entityId={projectId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
