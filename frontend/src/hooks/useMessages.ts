'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import type { Conversation, Message } from '@/types'
import { io, Socket } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''
const SOCKET_URL = (() => { try { return new URL(API).origin } catch { return '' } })()

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

// ── API helpers ───────────────────────────────────────────────
async function apiFetch<T>(path: string, token: string | null, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ── Hooks ─────────────────────────────────────────────────────
export function useConversations() {
  const { token } = useAuthStore()
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await apiFetch<Conversation[] | { data: Conversation[] }>('/conversations', token)
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
      const data = await apiFetch<Message[] | { data: Message[] }>(
        `/conversations/${conversationId}/messages?${params}`,
        token,
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
    mutationFn: async ({ conversationId, content, type, mediaUrl, encrypted }: {
      conversationId: string
      content: string
      type: string
      mediaUrl?: string
      encrypted?: boolean
    }) => {
      return apiFetch<Message>(`/conversations/${conversationId}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ content, type, mediaUrl, encrypted: encrypted ?? false }),
      })
    },
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
    mutationFn: async (participantId: string) => {
      return apiFetch<Conversation>('/conversations', token, {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useUploadMedia() {
  const { token } = useAuthStore()
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/upload/media`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return data.url as string
    },
  })
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
