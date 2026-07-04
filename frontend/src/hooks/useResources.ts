'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'

export type ResourceType =
  | 'YOUTUBE_VIDEO' | 'YOUTUBE_PLAYLIST' | 'PDF' | 'ARTICLE'
  | 'RESEARCH_PAPER' | 'WORKSHOP_RECORDING' | 'GUIDE' | 'BOOK_SUMMARY'

export interface Resource {
  id: string
  type: ResourceType
  title: string
  description: string | null
  url: string
  thumbnailUrl: string | null
  creator: string | null
  durationSecs: number | null
  language: string
  createdAt: string
  contributor: { id: string; displayName: string; profilePhoto: string | null }
}

export interface CreateResourceInput {
  type: ResourceType
  title: string
  url: string
  description?: string
  creator?: string
  durationSecs?: number
  language?: string
}

export function useResources(filter: { type?: string; q?: string; limit?: number; page?: number }) {
  const { type, q, limit = 20, page = 1 } = filter
  return useQuery({
    queryKey: ['resources', type, q, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) })
      if (type) params.set('type', type)
      if (q) params.set('q', q)
      const raw = await api.get<{ data?: Resource[]; total?: number } | Resource[]>(`/resources?${params.toString()}`)
      const data = Array.isArray(raw) ? raw : (raw.data ?? [])
      const total = Array.isArray(raw) ? data.length : (raw.total ?? data.length)
      return { data, total }
    },
    staleTime: 60_000,
    retry: 1,
  })
}

export function useCreateResource() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateResourceInput) =>
      api.post<Resource>('/resources', input, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

export function useDeleteResource() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/resources/${id}`, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}
