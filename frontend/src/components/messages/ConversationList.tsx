'use client'

import type { Conversation } from '@/types'
import { useAuthStore } from '@/stores/auth'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  isLoading: boolean
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function ConvAvatar({ conv, myId }: { conv: Conversation; myId: string }) {
  const other = conv.participants.find(p => p.id !== myId)
  const photo = conv.photoUrl ?? other?.profilePhoto
  const name = conv.name ?? other?.displayName ?? '?'
  if (photo) {
    return <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
  }
  return <span style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--saffron-600)' }}>{initials(name)}</span>
}

export function ConversationList({ conversations, activeId, onSelect, onNewChat, isLoading }: Props) {
  const { user } = useAuthStore()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--surface-elevated)', borderRight:'1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div style={{ padding:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontSize:'var(--text-base)', fontWeight:700, color:'var(--text-primary)' }}>Messages</span>
        <button
          onClick={onNewChat}
          style={{ width:36, height:36, borderRadius:'50%', background:'var(--saffron-500)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}
          aria-label="New message"
        >
          <i className="fa-solid fa-pen-to-square" style={{ fontSize:14 }} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding:'var(--space-3) var(--space-4)', flexShrink:0 }}>
        <div className="search-bar" style={{ padding:'var(--space-2) var(--space-3)' }}>
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
          <input type="search" placeholder="Search conversations…" style={{ fontSize:'var(--text-sm)' }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {isLoading && <div className="spinner-center"><div className="spinner" /></div>}
        {!isLoading && conversations.length === 0 && (
          <div style={{ padding:'var(--space-8) var(--space-4)', textAlign:'center', color:'var(--text-tertiary)' }}>
            <i className="fa-regular fa-comment-dots" style={{ fontSize:32, marginBottom:'var(--space-3)', display:'block', opacity:.4 }} />
            <p style={{ fontSize:'var(--text-sm)' }}>No conversations yet</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop:'var(--space-3)' }} onClick={onNewChat}>Start a chat</button>
          </div>
        )}
        {conversations.map(conv => {
          const other = conv.participants.find(p => p.id !== user?.id)
          const name = conv.name ?? other?.displayName ?? 'Unknown'
          const preview = conv.lastMessage?.content ?? ''
          const isActive = conv.id === activeId
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              style={{
                display:'flex', alignItems:'center', gap:'var(--space-3)',
                padding:'var(--space-3) var(--space-4)', width:'100%', background: isActive ? 'var(--saffron-50)' : 'none',
                border:'none', borderBottom:'1px solid var(--border-subtle)', cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                transition:'background var(--duration-fast)',
              }}
            >
              <div className="avatar avatar-md" style={{ flexShrink:0, border: conv.unreadCount > 0 ? '2px solid var(--saffron-500)' : '2px solid var(--border-subtle)' }}>
                <ConvAvatar conv={conv} myId={user?.id ?? ''} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:2 }}>
                  <span style={{ fontSize:'var(--text-sm)', fontWeight: conv.unreadCount > 0 ? 700 : 500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65%' }}>
                    {name}
                  </span>
                  <span style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', flexShrink:0 }}>
                    {conv.lastMessage ? timeAgo(conv.updatedAt) : ''}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                  <span style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                    {conv.lastMessage?.type === 'photo' ? '📷 Photo' : conv.lastMessage?.type === 'link' ? '🔗 Link' : preview}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span style={{ background:'var(--saffron-500)', color:'white', borderRadius:'var(--radius-full)', fontSize:10, fontWeight:700, padding:'1px 6px', flexShrink:0 }}>
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
