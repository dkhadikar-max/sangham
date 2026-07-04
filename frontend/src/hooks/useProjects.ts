'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'
import type { DiscoverProject } from '@/types'

export interface ProjectFilter {
  q?: string
  category?: string
  status?: string
}

async function fetchProjects(filter: ProjectFilter, token: string | null): Promise<DiscoverProject[]> {
  const params = new URLSearchParams({ status: filter.status ?? 'OPEN', limit: '30' })
  if (filter.q) params.set('q', filter.q)
  if (filter.category && filter.category !== 'ALL') params.set('category', filter.category)
  const data = await api.get<DiscoverProject[] | { data: DiscoverProject[] }>(`/projects?${params}`, token ?? undefined)
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
