'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import type { DiscoverPerson, DiscoverCategory } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

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
  const res = await fetch(`${API}/discover/people?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to load people')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

async function fetchCategories(): Promise<DiscoverCategory[]> {
  const res = await fetch(`${API}/discover/categories`)
  if (!res.ok) throw new Error('Failed to load categories')
  const data = await res.json()
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
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API}/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to follow')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-people'] }),
  })
}

export function useUnfollowUser() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API}/users/${userId}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to unfollow')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-people'] }),
  })
}
