'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

export interface CircleMemberInfo {
  user: { id: string; displayName: string; profilePhoto: string | null }
}

export interface CircleDetail {
  id: string
  topic: string
  description: string | null
  status: string
  scheduleDescription: string | null
  facilitator: { id: string; displayName: string; profilePhoto: string | null } | null
  event: { id: string; title: string; startsAt: string; onlineUrl: string | null } | null
  members: CircleMemberInfo[]
  _count: { members: number }
  isMember: boolean
}

export function useCircleDetail(id: string | null) {
  const { token } = useAuthStore()
  return useQuery<CircleDetail>({
    queryKey: ['circle', id],
    queryFn: () => api.get<CircleDetail>(`/study-circles/${id}`, token ?? undefined),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useJoinCircle() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/study-circles/${id}/join`, {}, token ?? undefined),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['circle', id] }),
  })
}

export function useLeaveCircle() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/study-circles/${id}/leave`, token ?? undefined),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['circle', id] }),
  })
}

export function useCreateCircle() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { associationId: string; topic: string; description?: string; scheduleDescription?: string }) =>
      api.post<{ id: string }>('/study-circles', input, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-circles'] }),
  })
}

export function useSetCircleStatus() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'OPEN' | 'ACTIVE' | 'CLOSED' }) =>
      api.put(`/study-circles/${id}/status`, { status }, token ?? undefined),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['circle', vars.id] }),
  })
}
