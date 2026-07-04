'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'
import type { DiscoverPerson, DiscoverCategory } from '@/types'

type ListResponse<T> = T[] | { data?: T[] }

export interface PeopleFilter {
  q?: string
  seekingIntent?: string
  isVerifiedTeacher?: boolean
  language?: string
  categoryId?: string
}

async function fetchPeople(filter: PeopleFilter, token: string | null): Promise<DiscoverPerson[]> {
  const params = new URLSearchParams({ limit: '20' })
  if (filter.q) params.set('q', filter.q)
  if (filter.seekingIntent) params.set('seekingIntent', filter.seekingIntent)
  if (filter.isVerifiedTeacher) params.set('isVerifiedTeacher', 'true')
  if (filter.language) params.set('language', filter.language)
  if (filter.categoryId) params.set('categoryId', filter.categoryId)
  const data = await api.get<ListResponse<DiscoverPerson>>(`/discover/people?${params}`, token ?? undefined)
  return Array.isArray(data) ? data : (data.data ?? [])
}

async function fetchCategories(): Promise<DiscoverCategory[]> {
  const data = await api.get<ListResponse<DiscoverCategory>>('/discover/categories')
  return Array.isArray(data) ? data : (data.data ?? [])
}

export function useDiscoverPeople(filter: PeopleFilter) {
  const { token } = useAuthStore()
  return useQuery<DiscoverPerson[]>({
    queryKey: ['discover-people', filter],
    queryFn: () => fetchPeople(filter, token),
    enabled: !!token,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useDiscoverCategories() {
  return useQuery<DiscoverCategory[]>({
    queryKey: ['discover-categories'],
    queryFn: fetchCategories,
    staleTime: 600_000,
    retry: 1,
  })
}

export function useFollowUser() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post(`/users/${userId}/follow`, {}, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-people'] }),
  })
}

export function useUnfollowUser() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}/follow`, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-people'] }),
  })
}
