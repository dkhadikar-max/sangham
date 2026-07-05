'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Conversation, Message } from '@/types'
import { useMessages, useSendMessage, useMessageRealtime } from '@/hooks/useMessages'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { encryptMessage, decryptMessage, getOrCreateKeypair, deriveSharedKey } from '@/lib/crypto'
import { api } from '@/lib/api/client'

interface Props {
  conversation: Conversation
  onBack: () => void
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const ENCRYPTION_ENABLED = true

export function ChatView({ conversation, onBack }: Props) {
  const { user, token } = useAuthStore()
  const { showToast } = useUiStore()
  const send = useSendMessage()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [decrypted, setDecrypted] = useState<Record<string, string>>({})
  const [canEncrypt, setCanEncrypt] = useState(false)
  const [partnerHasRead, setPartnerHasRead] = useState(false)
  const cryptoKeyRef = useRef<CryptoKey | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(conversation.id)

  // Flatten pages, decrypt any that came back encrypted, merge with local optimistic/realtime messages
  const serverMessages = (data?.pages.flat() ?? []).map((m) => {
    const withContent = m.encrypted && decrypted[m.id] !== undefined ? { ...m, content: decrypted[m.id] } : m
    // The partner just read the conversation — live-update the tick on our own messages
    return partnerHasRead && withContent.senderId === user?.id ? { ...withContent, isRead: true } : withContent
  })
  const allMessages = [...serverMessages, ...localMessages.filter(lm => !serverMessages.find(sm => sm.id === lm.id))]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Establish the shared E2E key for this conversation via ECDH (both sides derive the same key)
  useEffect(() => {
    if (!ENCRYPTION_ENABLED || !user) return
    let cancelled = false
    const other = conversation.participants.find(p => p.id !== user.id)
    if (!other) return
    cryptoKeyRef.current = null
    setCanEncrypt(false)
    ;(async () => {
      try {
        const { privateKey } = await getOrCreateKeypair()
        const { publicKey: theirPublicKey } = await api.get<{ publicKey: string | null }>(
          `/users/${other.id}/public-key`,
          token ?? undefined,
        )
        if (!theirPublicKey || cancelled) return
        const shared = await deriveSharedKey(privateKey, theirPublicKey)
        if (cancelled) return
        cryptoKeyRef.current = shared
        setCanEncrypt(true)
      } catch {
        if (!cancelled) setCanEncrypt(false)
      }
    })()
    return () => { cancelled = true }
  }, [conversation.id, user, token])

  // Decrypt any encrypted messages loaded from the server (not already decrypted)
  useEffect(() => {
    if (!canEncrypt || !cryptoKeyRef.current) return
    const key = cryptoKeyRef.current
    const raw = data?.pages.flat() ?? []
    const toDecrypt = raw.filter(m => m.encrypted && decrypted[m.id] === undefined)
    if (toDecrypt.length === 0) return
    let cancelled = false
    ;(async () => {
      const updates: Record<string, string> = {}
      for (const m of toDecrypt) {
        updates[m.id] = await decryptMessage(key, m.content)
      }
      if (!cancelled) setDecrypted(prev => ({ ...prev, ...updates }))
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, canEncrypt])

  // Scroll to bottom only when the newest message changes (not when loading older ones)
  const lastMsgId = allMessages[allMessages.length - 1]?.id
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lastMsgId])

  // Real-time handler
  const handleRealtime = useCallback(async (msg: Message) => {
    let content = msg.content
    if (msg.encrypted && cryptoKeyRef.current) {
      content = await decryptMessage(cryptoKeyRef.current, msg.content)
    }
    setPartnerHasRead(false) // a fresh incoming message resets the read tick until they see it
    setLocalMessages(prev => [...prev, { ...msg, content }])
  }, [])

  const handleRead = useCallback((readerId: string) => {
    if (readerId !== user?.id) setPartnerHasRead(true)
  }, [user?.id])

  useEffect(() => { setPartnerHasRead(false) }, [conversation.id])

  useMessageRealtime(conversation.id, handleRealtime, handleRead)

  async function handleSend(content: string, type: 'text' | 'link' | 'photo', mediaUrl?: string) {
    if (!user) return
    let finalContent = content
    let encrypted = false
    if (ENCRYPTION_ENABLED && cryptoKeyRef.current && content) {
      try {
        finalContent = await encryptMessage(cryptoKeyRef.current, content)
        encrypted = true
      } catch { /* send plaintext on crypto error */ }
    }

    // Optimistic message
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content,
      type,
      mediaUrl: mediaUrl ?? null,
      linkPreview: null,
      senderId: user.id,
      senderName: user.displayName,
      senderPhoto: user.profilePhoto,
      conversationId: conversation.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      encrypted,
    }
    setPartnerHasRead(false)
    setLocalMessages(prev => [...prev, optimistic])

    send.mutate({ conversationId: conversation.id, content: finalContent, type, mediaUrl, encrypted }, {
      onSuccess: () => {
        setLocalMessages(prev => prev.filter(m => m.id !== optimistic.id))
      },
      onError: () => {
        setLocalMessages(prev => prev.filter(m => m.id !== optimistic.id))
        showToast('Failed to send message', 'error')
      },
    })
  }

  const other = conversation.participants.find(p => p.id !== user?.id)
  const chatName = conversation.name ?? other?.displayName ?? 'Chat'
  const chatPhoto = conversation.photoUrl ?? other?.profilePhoto

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--surface-bg)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3) var(--space-4)', background:'var(--surface-elevated)', borderBottom:'1px solid var(--border-subtle)', flexShrink:0 }}>
        <button className="panel-back" onClick={onBack} aria-label="Back" style={{ flexShrink:0 }}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className="avatar avatar-md" style={{ flexShrink:0 }}>
          {chatPhoto
            ? <img src={chatPhoto} alt={chatName} />
            : <span style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--saffron-800)' }}>{initials(chatName)}</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{chatName}</div>
          {ENCRYPTION_ENABLED && (
            <div style={{ fontSize:10, color:'var(--saffron-800)', display:'flex', alignItems:'center', gap:3 }}>
              <i className="fa-solid fa-lock" style={{ fontSize:8 }} /> {canEncrypt ? 'End-to-end encrypted' : 'Encryption unavailable'}
            </div>
          )}
        </div>
        <button
          style={{ width:36, height:36, borderRadius:'50%', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-tertiary)' }}
          onClick={() => showToast('Call — coming soon', 'info')}
          aria-label="Call"
        >
          <i className="fa-solid fa-phone" style={{ fontSize:14 }} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'var(--space-3) var(--space-4)' }}>
        {/* Load more */}
        {hasNextPage && (
          <div style={{ textAlign:'center', marginBottom:'var(--space-3)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchNextPage()}>Load earlier messages</button>
          </div>
        )}

        {isLoading && <div className="spinner-center"><div className="spinner" /></div>}

        {!isLoading && allMessages.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--text-tertiary)', padding:'var(--space-12) 0' }}>
            <i className="fa-regular fa-comment-dots" style={{ fontSize:40, display:'block', marginBottom:'var(--space-3)', opacity:.4 }} />
            <p style={{ fontSize:'var(--text-sm)' }}>No messages yet. Say hello!</p>
          </div>
        )}

        {allMessages.map((msg, i) => {
          const isMine = msg.senderId === user?.id
          const prevMsg = allMessages[i - 1]
          const showDateDivider = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()
          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div style={{ textAlign:'center', margin:'var(--space-4) 0', fontSize:10, color:'var(--text-tertiary)' }}>
                  {new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
                </div>
              )}
              <MessageBubble msg={msg} isMine={isMine} />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={send.isPending} encrypted={ENCRYPTION_ENABLED && canEncrypt} />
    </div>
  )
}
