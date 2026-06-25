'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import type { FeedPost } from '@/types'

type FeedResponse = { data?: FeedPost[] } | FeedPost[]

export function useFeed(filter: string) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['feed', filter],
    queryFn: async () => {
      const filterParam = filter !== 'all' ? `&filter=${filter}` : ''
      const raw = await api.get<FeedResponse>(
        `/users/me/community-feed?limit=20&skip=0${filterParam}`,
        token ?? undefined,
      )
      return Array.isArray(raw) ? raw : ((raw as { data?: FeedPost[] }).data ?? [])
    },
    enabled: !!token,
    staleTime: 60_000,
  })
}

export function useLoadMore(filter: string, offset: number) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['feed-more', filter, offset],
    queryFn: async () => {
      const filterParam = filter !== 'all' ? `&filter=${filter}` : ''
      const raw = await api.get<FeedResponse>(
        `/users/me/community-feed?limit=20&skip=${offset}${filterParam}`,
        token ?? undefined,
      )
      return Array.isArray(raw) ? raw : ((raw as { data?: FeedPost[] }).data ?? [])
    },
    enabled: false,
  })
}

export function useLikePost() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) =>
      api.post<{ liked: boolean }>(`/posts/${postId}/like`, {}, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

interface SidebarVerse {
  content?: string
  source?: string
  textId?: string
}

export function useDailyVerse(lang = 'en') {
  return useQuery({
    queryKey: ['daily-verse', lang],
    queryFn: () => api.get<SidebarVerse>(`/library/daily-verse?lang=${lang}`),
    staleTime: 3_600_000,
    retry: false,
  })
}

export function useTrendingCommunities() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['trending-communities'],
    queryFn: async () => {
      const raw = await api.get<{ data?: CommunityRow[]; [k: string]: unknown }>(
        '/associations?limit=4&sort=members',
        token ?? undefined,
      )
      const rows = Array.isArray(raw) ? raw : (raw.data ?? [])
      return (rows as CommunityRow[]).slice(0, 3)
    },
    staleTime: 300_000,
    retry: false,
  })
}

interface CommunityRow {
  id: string
  name: string
  tradition?: string | null
  _count?: { members?: number }
  memberCount?: number
}

export function useSuggestedConnections() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['suggested-connections'],
    queryFn: async () => {
      const raw = await api.get<{ data?: PersonRow[]; [k: string]: unknown }>(
        '/discover/recommended',
        token ?? undefined,
      )
      const rows = Array.isArray(raw) ? raw : (raw.data ?? [])
      return (rows as PersonRow[]).slice(0, 3)
    },
    enabled: !!token,
    staleTime: 300_000,
    retry: false,
  })
}

interface PersonRow {
  id: string
  displayName: string
  profilePhoto?: string | null
  tradition?: string | null
  role?: string
}

export function useSidebarEvents() {
  return useQuery({
    queryKey: ['sidebar-events'],
    queryFn: async () => {
      const raw = await api.get<{ data?: EventRow[]; [k: string]: unknown }>(
        '/events?limit=3',
      )
      const rows = Array.isArray(raw) ? raw : (raw.data ?? [])
      const now = Date.now()
      return (rows as EventRow[])
        .filter((e) => new Date(e.startsAt).getTime() >= now)
        .slice(0, 3)
    },
    staleTime: 300_000,
    retry: false,
  })
}

interface EventRow {
  id: string
  title: string
  startsAt: string
  location?: string | null
}
