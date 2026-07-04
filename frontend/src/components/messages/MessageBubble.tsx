'use client'

import type { Message } from '@/types'

interface Props {
  msg: Message
  isMine: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function isUrl(s: string) {
  try { return Boolean(new URL(s)) } catch { return false }
}

export function MessageBubble({ msg, isMine }: Props) {
  const bubbleStyle: React.CSSProperties = {
    maxWidth: '72%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isMine ? 'linear-gradient(135deg,var(--saffron-700),var(--saffron-800))' : 'var(--surface-elevated)',
    color: isMine ? 'white' : 'var(--text-primary)',
    border: isMine ? 'none' : '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-1)',
    wordBreak: 'break-word',
  }

  const metaColor = isMine ? 'rgba(255,255,255,0.65)' : 'var(--text-tertiary)'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom:'var(--space-1)' }}>
      {/* Sender name (group chats, not mine) */}
      {!isMine && (
        <span style={{ fontSize:'var(--text-2xs)', color:'var(--saffron-800)', fontWeight:600, marginLeft:'var(--space-2)', marginBottom:2 }}>
          {msg.senderName}
        </span>
      )}

      <div style={bubbleStyle}>
        {/* Photo */}
        {msg.type === 'photo' && msg.mediaUrl && (
          <img
            src={msg.mediaUrl}
            alt="shared photo"
            style={{ width:'100%', maxWidth:220, borderRadius:12, display:'block', marginBottom: msg.content ? 'var(--space-2)' : 0 }}
          />
        )}

        {/* Link preview */}
        {msg.type === 'link' && msg.linkPreview && (
          <a
            href={msg.linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display:'block', background: isMine ? 'rgba(0,0,0,0.12)' : 'var(--surface-bg)', borderRadius:10, overflow:'hidden', marginBottom: msg.content ? 'var(--space-2)' : 0, textDecoration:'none' }}
          >
            {msg.linkPreview.image && (
              <img src={msg.linkPreview.image} alt="" style={{ width:'100%', height:80, objectFit:'cover', display:'block' }} />
            )}
            <div style={{ padding:'var(--space-2) var(--space-3)' }}>
              <div style={{ fontSize:'var(--text-xs)', fontWeight:600, color: isMine ? 'white' : 'var(--text-primary)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {msg.linkPreview.title ?? msg.linkPreview.url}
              </div>
              {msg.linkPreview.description && (
                <div style={{ fontSize:10, color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {msg.linkPreview.description}
                </div>
              )}
            </div>
          </a>
        )}

        {/* Text */}
        {msg.content && (
          <span style={{ fontSize:'var(--text-sm)', lineHeight:1.5 }}>{msg.content}</span>
        )}

        {/* Meta row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'var(--space-1)', marginTop:4 }}>
          {msg.encrypted && (
            <i className="fa-solid fa-lock" style={{ fontSize:8, color: metaColor }} title="Encrypted" />
          )}
          <span style={{ fontSize:9, color: metaColor }}>{formatTime(msg.createdAt)}</span>
          {isMine && (
            <i className={`fa-solid ${msg.isRead ? 'fa-check-double' : 'fa-check'}`} style={{ fontSize:9, color: metaColor }} />
          )}
        </div>
      </div>
    </div>
  )
}
