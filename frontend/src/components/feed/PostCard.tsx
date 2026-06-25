'use client'

import { useState, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import type { FeedPost } from '@/types'

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRole(role: string): string {
  const map: Record<string, string> = {
    MODERATOR: 'Moderator', ADMIN: 'Admin', TEACHER: 'Teacher',
    BHIKKHU: 'Bhikkhu', BHIKKHUNI: 'Bhikkhuni',
  }
  return map[role] ?? 'Practitioner'
}

interface PostCardProps {
  post: FeedPost
  onReply?: (postId: string) => void
  onMessage?: (authorId: string, authorName: string) => void
}

export function PostCard({ post, onReply, onMessage }: PostCardProps) {
  const { user, token } = useAuthStore()
  const author = post.author ?? {}
  const likeCount = post._count?.likes ?? post.likesCount ?? 0
  const cmtCount = post._count?.comments ?? post.commentsCount ?? 0
  const [liked, setLiked] = useState(post.isLiked ?? false)
  const [likeCnt, setLikeCnt] = useState(likeCount)
  const [liking, setLiking] = useState(false)

  const handleLike = useCallback(async () => {
    if (!token || liking) return
    setLiking(true)
    try {
      const data = await api.post<{ liked: boolean }>(`/posts/${post.id}/like`, {}, token)
      setLiked(data.liked)
      setLikeCnt((c) => data.liked ? c + 1 : Math.max(0, c - 1))
      if (data.liked && typeof navigator.vibrate === 'function') navigator.vibrate(20)
    } catch {
      // silently fail
    } finally {
      setLiking(false)
    }
  }, [post.id, token, liking])

  const tradTags = post.traditionTags ?? []
  const role = fmtRole(author.role ?? '')
  const myInitials = (user?.displayName ?? 'Y').charAt(0).toUpperCase()

  return (
    <div className="post-card feed-card">
      {/* Header */}
      <div className="post-header">
        <Avatar
          src={author.profilePhoto}
          name={author.displayName ?? '?'}
          size="md"
          className={author.isVerifiedClergy ? 'avatar-verified' : undefined}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="post-author-name">
            {author.displayName ?? 'Unknown'}
            {author.isVerifiedClergy && <span className="badge-verified" />}
          </div>
          <div className="post-meta">
            <span>{role}</span>
            {author.city && <><span className="post-meta-dot" /><span>{author.city}</span></>}
            <span className="post-meta-dot" />
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tradition tags */}
      {tradTags.length > 0 && (
        <div className="post-tradition-tags">
          {tradTags.map((t) => (
            <span key={t} className="post-tradition-tag">{t}</span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="post-content">{post.content}</div>

      {/* Media */}
      {(post.mediaUrls ?? []).length > 0 && (
        <div className="post-media">
          {post.mediaUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" loading="lazy" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="disc-actions">
        <button
          className={`disc-btn${liked ? ' liked' : ''}`}
          onClick={handleLike}
          disabled={!token}
          aria-label="Like"
        >
          <svg viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Like</span>
          {likeCnt > 0 && <span className="disc-count">{likeCnt}</span>}
        </button>

        <div className="disc-btn-divider" />

        <button
          className="disc-btn"
          onClick={() => onReply?.(post.id)}
          aria-label="Reply"
        >
          <svg viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Reply</span>
          {cmtCount > 0 && <span className="disc-count">{cmtCount}</span>}
        </button>

        <div className="disc-btn-divider" />

        <button
          className="disc-btn"
          onClick={() => onMessage?.(author.id ?? '', author.displayName ?? '')}
          aria-label="Message"
        >
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <span>Message</span>
        </button>
      </div>

      {/* Thread link */}
      {cmtCount > 0 && (
        <button className="disc-thread-link" onClick={() => onReply?.(post.id)}>
          <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
          {cmtCount} {cmtCount === 1 ? 'reply' : 'replies'} — join the discussion
        </button>
      )}

      {/* Reply bar */}
      {user && (
        <div className="disc-reply-bar">
          <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
            {user.profilePhoto
              ? <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : myInitials}
          </div>
          <button className="disc-reply-prompt" onClick={() => onReply?.(post.id)}>
            Write a reply…
          </button>
        </div>
      )}
    </div>
  )
}
