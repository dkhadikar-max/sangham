'use client'

import { useResourceDetail } from '@/hooks/useResourceDetail'
import { useUiStore } from '@/stores/ui'
import { DiscussionThread } from '@/components/discussion/DiscussionThread'

interface Props {
  resourceId: string
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  YOUTUBE_VIDEO: 'YouTube Video',
  YOUTUBE_PLAYLIST: 'YouTube Playlist',
  PDF: 'PDF',
  ARTICLE: 'Article',
  RESEARCH_PAPER: 'Research Paper',
  WORKSHOP_RECORDING: 'Workshop Recording',
  GUIDE: 'Guide',
  BOOK_SUMMARY: 'Book Summary',
}

export function ResourceDetailPanel({ resourceId, onClose }: Props) {
  const { viewProfile } = useUiStore()
  const { data: resource, isLoading } = useResourceDetail(resourceId)

  return (
    <div className="panel-comm" style={{ zIndex: 55 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Resource</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        )}

        {resource && (
          <div style={{ padding: 'var(--space-4)' }}>
            {resource.thumbnailUrl && (
              <img src={resource.thumbnailUrl} alt="" style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }} />
            )}

            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{resource.title}</h2>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              {TYPE_LABELS[resource.type] ?? resource.type}
              {resource.creator ? ` · ${resource.creator}` : ''}
              {resource.durationSecs ? ` · ${Math.round(resource.durationSecs / 60)}m` : ''}
              {` · ${(resource.language || 'en').toUpperCase()}`}
            </div>

            <a
              href={resource.url}
              target="_blank"
              rel="noopener"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 'var(--space-4)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              Open Resource
            </a>

            {resource.description && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>{resource.description}</p>
            )}

            <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Shared By</div>
            <button
              onClick={() => viewProfile(resource.contributor.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 'var(--space-4)' }}
            >
              <div className="avatar-sm">
                {resource.contributor.profilePhoto
                  ? <img src={resource.contributor.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : resource.contributor.displayName.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>{resource.contributor.displayName}</span>
            </button>

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <DiscussionThread entityType="resource" entityId={resourceId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
