'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import type { DiscoverProject } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface ProjectFilter {
  q?: string
  category?: string
  status?: string
}

async function fetchProjects(filter: ProjectFilter, token: string | null): Promise<DiscoverProject[]> {
  const params = new URLSearchParams({ status: filter.status ?? 'OPEN', limit: '30' })
  if (filter.q) params.set('q', filter.q)
  if (filter.category && filter.category !== 'ALL') params.set('category', filter.category)
  const res = await fetch(`${API}/projects?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to load projects')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export function useProjects(filter: ProjectFilter) {
  const { token } = useAuthStore()
  return useQuery<DiscoverProject[]>({
    queryKey: ['projects', filter],
    queryFn: () => fetchProjects(filter, token),
    staleTime: 60_000,
    retry: 1,
  })
}
