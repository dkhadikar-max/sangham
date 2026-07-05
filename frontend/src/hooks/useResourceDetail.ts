'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Resource } from './useResources'

export function useResourceDetail(id: string | null) {
  return useQuery<Resource>({
    queryKey: ['resource', id],
    queryFn: () => api.get<Resource>(`/resources/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  })
}
