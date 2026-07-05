'use client'

import { useState } from 'react'
import { useDiscussionThread, usePostDiscussionMessage, useDeleteDiscussionPost, type DiscussionEntityType } from '@/hooks/useDiscussion'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

interface Props {
  entityType: DiscussionEntityType
  entityId: string
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DiscussionThread({ entityType, entityId }: Props) {
  const { user, token } = useAuthStore()
  const { showToast, viewProfile } = useUiStore()
  const { data, isLoading } = useDiscussionThread(entityType, entityId)
  const postMessage = usePostDiscussionMessage(entityType, entityId)
  const deletePost = useDeleteDiscussionPost(entityType, entityId)
  const [text, setText] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  function handleSend() {
    const content = text.trim()
    if (!content) return
    if (!token) { showToast('Sign in to join the discussion', 'info'); return }
    postMessage.mutate(content, {
      onSuccess: () => setText(''),
      onError: (e) => showToast((e as Error).message || 'Failed to post', 'error'),
    })
  }

  function handleDelete(postId: string) {
    if (confirmingDelete !== postId) {
      setConfirmingDelete(postId)
      setTimeout(() => setConfirmingDelete((cur) => (cur === postId ? null : cur)), 4000)
      return
    }
    setConfirmingDelete(null)
    deletePost.mutate(postId, { onError: (e) => showToast((e as Error).message || 'Failed to delete', 'error') })
  }

  const isMod = user?.role === 'MODERATOR' || user?.role === 'SUPER_ADMIN'

  return (
    <div>
      <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Discussion</div>

      {isLoading && (
        <div className="spinner-center" style={{ padding: 'var(--space-4) 0' }}><div className="spinner" /></div>
      )}

      {data && data.posts.length === 0 && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
          No messages yet. Start the discussion.
        </p>
      )}

      {data?.posts.map((post) => (
        <div key={post.id} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <button onClick={() => viewProfile(post.author.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <div className="avatar-sm">
              {post.author.profilePhoto
                ? <img src={post.author.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials(post.author.displayName)}
            </div>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <button onClick={() => viewProfile(post.author.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                {post.author.displayName}
              </button>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{timeAgo(post.createdAt)}</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>{post.content}</p>
            {(post.authorId === user?.id || isMod) && (
              <button
                onClick={() => handleDelete(post.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--text-xs)', color: confirmingDelete === post.id ? 'var(--error-500)' : 'var(--text-tertiary)', marginTop: 4 }}
              >
                {confirmingDelete === post.id ? 'Confirm delete?' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <input
          className="input"
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          maxLength={2000}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={!text.trim() || postMessage.isPending}>
          {postMessage.isPending ? <span className="spinner spinner-sm" /> : 'Send'}
        </button>
      </div>
    </div>
  )
}
