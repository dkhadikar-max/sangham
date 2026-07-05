'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useResources, useDeleteResource, type Resource, type ResourceType } from '@/hooks/useResources'
import { CreateResourcePanel } from './CreateResourcePanel'
import { ResourceDetailPanel } from './ResourceDetailPanel'

const TYPE_LABELS: Record<ResourceType, string> = {
  YOUTUBE_VIDEO: 'YouTube Video',
  YOUTUBE_PLAYLIST: 'YouTube Playlist',
  PDF: 'PDF',
  ARTICLE: 'Article',
  RESEARCH_PAPER: 'Research Paper',
  WORKSHOP_RECORDING: 'Workshop Recording',
  GUIDE: 'Guide',
  BOOK_SUMMARY: 'Book Summary',
}

const TYPE_ICONS: Record<ResourceType, string> = {
  YOUTUBE_VIDEO: 'fa-video',
  YOUTUBE_PLAYLIST: 'fa-list',
  PDF: 'fa-file-pdf',
  ARTICLE: 'fa-newspaper',
  RESEARCH_PAPER: 'fa-microscope',
  WORKSHOP_RECORDING: 'fa-headphones',
  GUIDE: 'fa-book-open',
  BOOK_SUMMARY: 'fa-bookmark',
}

const TYPE_COLORS: Record<string, { bg: string; clr: string }> = {
  YOUTUBE_VIDEO: { bg: '#f5f3ff', clr: '#7c3aed' },
  YOUTUBE_PLAYLIST: { bg: '#f5f3ff', clr: '#7c3aed' },
  PDF: { bg: '#fef2f2', clr: '#ef4444' },
  ARTICLE: { bg: '#fffbeb', clr: '#f59e0b' },
  RESEARCH_PAPER: { bg: '#eff6ff', clr: '#3b82f6' },
  WORKSHOP_RECORDING: { bg: '#f0fdf4', clr: '#22c55e' },
  GUIDE: { bg: '#fff7ed', clr: '#f97316' },
  BOOK_SUMMARY: { bg: '#F8F5EF', clr: '#C79A3B' },
}

function ResourceRow({ r, canDelete, onDelete, onOpenDetail }: { r: Resource; canDelete: boolean; onDelete: (id: string) => void; onOpenDetail: (id: string) => void }) {
  const clrs = TYPE_COLORS[r.type] || { bg: '#F8F5EF', clr: '#C79A3B' }
  const dur = r.durationSecs ? `${Math.round(r.durationSecs / 60)}m · ` : ''
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      setTimeout(() => setConfirmingDelete(false), 4000)
      return
    }
    setConfirmingDelete(false)
    onDelete(r.id)
  }

  return (
    <div className="resource-card" style={{ cursor: 'default' }}>
      <button
        type="button"
        onClick={() => window.open(r.url, '_blank', 'noopener')}
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
      >
        {r.thumbnailUrl
          ? <img src={r.thumbnailUrl} alt="" loading="lazy" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: clrs.bg, color: clrs.clr }}>
              <i className={`fa-solid ${TYPE_ICONS[r.type] || 'fa-paperclip'}`} style={{ fontSize: 18 }} />
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {TYPE_LABELS[r.type] || r.type}{r.creator ? ' · ' + r.creator : ''}{dur ? ' · ' + dur : ''}{(r.language || 'en').toUpperCase()}
          </div>
          {r.description && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={() => onOpenDetail(r.id)}
        aria-label="View details and discussion"
        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 8, flexShrink: 0 }}
      >
        <i className="fa-regular fa-comment-dots" />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label="Remove resource"
          style={{ background: 'none', border: 'none', color: confirmingDelete ? 'var(--error-500)' : 'var(--text-tertiary)', cursor: 'pointer', padding: 8, flexShrink: 0, fontSize: confirmingDelete ? 'var(--text-xs)' : undefined, fontWeight: confirmingDelete ? 600 : undefined, whiteSpace: 'nowrap' }}
        >
          {confirmingDelete ? 'Confirm?' : <i className="fa-solid fa-trash-can" />}
        </button>
      )}
    </div>
  )
}

export function ResourcesView({ searchQuery }: { searchQuery: string }) {
  const { token, user } = useAuthStore()
  const { showToast } = useUiStore()
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [viewingResourceId, setViewingResourceId] = useState<string | null>(null)
  const deleteResource = useDeleteResource()

  const { data, isLoading, error } = useResources({ type: typeFilter || undefined, q: searchQuery || undefined, page, limit: 20 })
  const resources = data?.data ?? []
  const total = data?.total ?? 0

  const isMod = user?.role === 'MODERATOR' || user?.role === 'SUPER_ADMIN'

  async function handleDelete(id: string) {
    try {
      await deleteResource.mutateAsync(id)
      showToast('Resource removed', 'success')
    } catch (err) {
      showToast((err as Error).message || 'Failed to remove resource', 'error')
    }
  }

  return (
    <div style={{ padding: '0 var(--space-4) var(--space-8)' }}>
      {showCreate && <CreateResourcePanel onClose={() => setShowCreate(false)} />}
      {viewingResourceId && (
        <ResourceDetailPanel resourceId={viewingResourceId} onClose={() => setViewingResourceId(null)} />
      )}

      {/* Header */}
      <div style={{ padding: 'var(--space-4) 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Resources</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>Videos, articles, and guides shared by the community</p>
        </div>
        {token && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />Share
          </button>
        )}
      </div>

      {/* Type filter */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <select
          className="input"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer', width: 'auto', minWidth: 180 }}
        >
          <option value="">All resource types</option>
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="spinner-center"><div className="spinner" /></div>}

      {!isLoading && error && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-tertiary)' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 36, marginBottom: 'var(--space-3)', display: 'block', color: 'var(--saffron-300)' }} />
          <p style={{ fontSize: 'var(--text-sm)' }}>Could not load resources.</p>
        </div>
      )}

      {!isLoading && !error && resources.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-tertiary)' }}>
          <i className="fa-solid fa-book-bookmark" style={{ fontSize: 36, marginBottom: 'var(--space-3)', display: 'block', color: 'var(--saffron-300)' }} />
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {searchQuery ? `No resources match “${searchQuery}”` : 'No resources yet'}
          </p>
          {!searchQuery && <p style={{ fontSize: 'var(--text-xs)' }}>Be the first to share a video, article, or guide.</p>}
        </div>
      )}

      {!isLoading && !error && resources.length > 0 && (
        <div>
          {resources.map(r => (
            <ResourceRow
              key={r.id}
              r={r}
              canDelete={!!token && (isMod || r.contributor.id === user?.id)}
              onDelete={handleDelete}
              onOpenDetail={setViewingResourceId}
            />
          ))}
        </div>
      )}

      {!isLoading && total > page * 20 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)}>Load more</button>
        </div>
      )}
    </div>
  )
}
