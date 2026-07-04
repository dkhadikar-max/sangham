'use client'

import { useState, useEffect } from 'react'
import { ConversationList } from './ConversationList'
import { ChatView } from './ChatView'
import { useConversations } from '@/hooks/useMessages'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Conversation } from '@/types'

export function MessagesTab() {
  const { token } = useAuthStore()
  const { showToast, pendingConversationId, clearPendingConversation } = useUiStore()
  const { data: conversations = [], isLoading } = useConversations()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const activeConv = conversations.find(c => c.id === activeConvId) ?? null

  useEffect(() => {
    if (pendingConversationId) {
      setActiveConvId(pendingConversationId)
      clearPendingConversation()
    }
  }, [pendingConversationId, clearPendingConversation])

  function handleNewChat() {
    showToast('Search for a person in Discover and tap Message', 'info')
  }

  if (!token) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'var(--space-4)', color:'var(--text-tertiary)', padding:'var(--space-8)' }}>
        <i className="fa-regular fa-comment-dots" style={{ fontSize:48, opacity:.4 }} />
        <p style={{ fontSize:'var(--text-sm)', textAlign:'center' }}>Sign in to access your messages</p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Conversation list — always visible on desktop, hidden on mobile when chat open */}
      <div className={`messages-sidebar${activeConv ? ' messages-sidebar-mobile-hidden' : ''}`}>
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={setActiveConvId}
          onNewChat={handleNewChat}
          isLoading={isLoading}
        />
      </div>

      {/* Chat view */}
      {activeConv && (
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <ChatView
            conversation={activeConv}
            onBack={() => setActiveConvId(null)}
          />
        </div>
      )}

      {/* Desktop empty state when no chat selected */}
      {!activeConv && (
        <div
          className="messages-empty-desktop"
          style={{ flex:1, alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'var(--space-4)', color:'var(--text-tertiary)' }}
        >
          <i className="fa-regular fa-comment-dots" style={{ fontSize:48, opacity:.3 }} />
          <p style={{ fontSize:'var(--text-sm)' }}>Select a conversation</p>
        </div>
      )}
    </div>
  )
}
