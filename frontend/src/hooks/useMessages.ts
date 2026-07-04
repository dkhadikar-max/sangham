'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api, API_BASE, refreshAccessToken } from '@/lib/api/client'
import { getOrCreateKeypair } from '@/lib/crypto'
import type { Conversation, Message } from '@/types'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = (() => { try { return new URL(API_BASE).origin } catch { return '' } })()

// ── Singleton socket ──────────────────────────────────────────
let _socket: Socket | null = null

function getSocket(token: string): Socket {
  if (!_socket || !_socket.connected) {
    _socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    })
  }
  return _socket
}

export function disconnectSocket() {
  _socket?.disconnect()
  _socket = null
}

// ── Hooks ─────────────────────────────────────────────────────
export function useConversations() {
  const { token } = useAuthStore()
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await api.get<Conversation[] | { data: Conversation[] }>('/conversations', token ?? undefined)
      return Array.isArray(data) ? data : (data.data ?? [])
    },
    enabled: !!token,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useMessages(conversationId: string | null) {
  const { token } = useAuthStore()
  return useInfiniteQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '30' })
      if (pageParam) params.set('before', pageParam as string)
      const data = await api.get<Message[] | { data: Message[] }>(
        `/conversations/${conversationId}/messages?${params}`,
        token ?? undefined,
      )
      return Array.isArray(data) ? data : (data.data ?? [])
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.length < 30 ? undefined : lastPage[lastPage.length - 1]?.id,
    enabled: !!conversationId && !!token,
    staleTime: 0,
    retry: 1,
  })
}

export function useSendMessage() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, content, type, mediaUrl, encrypted }: {
      conversationId: string
      content: string
      type: string
      mediaUrl?: string
      encrypted?: boolean
    }) =>
      api.post<Message>(
        `/conversations/${conversationId}/messages`,
        { content, type, mediaUrl, encrypted: encrypted ?? false },
        token ?? undefined,
      ),
    onSuccess: (_msg, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useCreateConversation() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (participantId: string) =>
      api.post<Conversation>('/conversations', { participantId }, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

async function uploadMedia(file: File, token: string | null, isRetry = false): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (res.status === 401 && token && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) return uploadMedia(file, newToken, true)
  }
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.url as string
}

export function useUploadMedia() {
  const { token } = useAuthStore()
  return useMutation({
    mutationFn: (file: File) => uploadMedia(file, token ?? null),
  })
}

// Ensures this device's E2E public key is on the server so others can message us.
// Idempotent — getOrCreateKeypair caches the keypair locally, so this is a cheap no-op after the first run.
export function usePublishPublicKey() {
  const { token } = useAuthStore()
  useEffect(() => {
    if (!token) return
    let cancelled = false
    getOrCreateKeypair().then(({ publicKeyB64 }) => {
      if (cancelled) return
      api.put('/users/me/public-key', { publicKey: publicKeyB64 }, token).catch(() => {})
    })
    return () => { cancelled = true }
  }, [token])
}

// Real-time subscription — adds new messages to query cache
export function useMessageRealtime(conversationId: string | null, onNewMessage: (msg: Message) => void) {
  const { token } = useAuthStore()
  const cbRef = useRef(onNewMessage)
  cbRef.current = onNewMessage

  useEffect(() => {
    if (!conversationId || !token) return
    const socket = getSocket(token)
    socket.emit('join_conversation', conversationId)
    const handler = (msg: Message) => cbRef.current(msg)
    socket.on(`message:${conversationId}`, handler)
    return () => {
      socket.off(`message:${conversationId}`, handler)
      socket.emit('leave_conversation', conversationId)
    }
  }, [conversationId, token])
}
