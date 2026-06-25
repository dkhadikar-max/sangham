'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import type {
  LibraryCollection,
  LibraryText,
  LibraryTextDetail,
  TextSegment,
  Highlight,
  ServerProgress,
} from '@/types'

const SEG_LIMIT = 50

export function useLibraryCollections() {
  return useQuery({
    queryKey: ['library-collections'],
    queryFn: () => api.get<LibraryCollection[]>('/library/collections'),
    staleTime: 300_000,
    retry: 1,
  })
}

type SearchParams = { limit?: number; sort?: string; q?: string; collectionId?: string }

export function useLibrarySearch(params?: SearchParams) {
  const { limit = 24, sort, q, collectionId } = params ?? {}
  const qs = new URLSearchParams({ limit: String(limit) })
  if (sort) qs.set('sort', sort)
  if (q) qs.set('q', q)
  if (collectionId) qs.set('collectionId', collectionId)
  const key = qs.toString()
  return useQuery({
    queryKey: ['library-search', key],
    queryFn: async () => {
      const raw = await api.get<{ data?: LibraryText[] } | LibraryText[]>(`/library/search?${qs}`)
      return Array.isArray(raw) ? raw : ((raw as { data?: LibraryText[] }).data ?? [])
    },
    staleTime: 300_000,
    retry: 1,
  })
}

export function useLibraryText(textId: string | null | undefined) {
  return useQuery({
    queryKey: ['library-text', textId],
    queryFn: () =>
      api.get<LibraryTextDetail>(
        `/library/texts/${textId}?segOffset=0&segLimit=${SEG_LIMIT}`,
      ),
    enabled: !!textId,
    staleTime: 600_000,
    retry: 1,
  })
}

export function useLibraryMoreSegments() {
  return useMutation({
    mutationFn: ({ textId, offset }: { textId: string; offset: number }) =>
      api.get<TextSegment[]>(
        `/library/texts/${textId}/segments?offset=${offset}&limit=${SEG_LIMIT}`,
      ),
  })
}

export function useLibraryBookmarks() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['library-bookmarks'],
    queryFn: () => api.get<LibraryText[]>('/library/my-bookmarks', token ?? undefined),
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  })
}

export function useLibraryHighlights(textId: string | null | undefined) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['library-highlights', textId],
    queryFn: () =>
      api.get<Highlight[]>(`/library/texts/${textId}/highlights`, token ?? undefined),
    enabled: !!token && !!textId,
    staleTime: 60_000,
    retry: false,
  })
}

export function useLibraryProgress(textId: string | null | undefined) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['library-server-progress', textId],
    queryFn: () =>
      api.get<ServerProgress>(
        `/library/texts/${textId}/progress`,
        token ?? undefined,
      ),
    enabled: !!token && !!textId,
    staleTime: 60_000,
    retry: false,
  })
}

export function useBookmarkText() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ textId, bookmark }: { textId: string; bookmark: boolean }) =>
      bookmark
        ? api.post<void>(`/library/texts/${textId}/bookmarks`, {}, token ?? undefined)
        : api.delete<void>(`/library/texts/${textId}/bookmarks`, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-bookmarks'] })
    },
  })
}

export function useCreateHighlight() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ textId, segmentId, selectedText, color }: { textId: string; segmentId: string; selectedText: string; color: string }) =>
      api.post<{ id: string }>('/library/highlights', { textId, segmentId, selectedText, color }, token ?? undefined),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['library-highlights', vars.textId] })
    },
  })
}

export function useAICompanion() {
  const { token } = useAuthStore()
  return useMutation({
    mutationFn: ({
      textId,
      action,
      passage,
    }: {
      textId: string
      action: string
      passage?: string
    }) =>
      api.post<{ result: string }>(
        `/library/texts/${textId}/ai`,
        { action, passage },
        token ?? undefined,
      ),
  })
}
