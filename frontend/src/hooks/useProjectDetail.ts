'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

export interface ProjectMemberInfo {
  user: { id: string; displayName: string; profilePhoto: string | null; role: string }
  role: string
}

export interface ProjectDetail {
  id: string
  title: string
  icon: string | null
  purpose: string | null
  description: string | null
  status: string
  category: string | null
  skillsNeeded: string[]
  requiredLanguages: string[]
  owner: { id: string; displayName: string; profilePhoto: string | null }
  members: ProjectMemberInfo[]
  _count: { members: number }
  isMember: boolean
  isOwner: boolean
}

export function useProjectDetail(id: string | null) {
  const { token } = useAuthStore()
  return useQuery<ProjectDetail>({
    queryKey: ['project', id],
    queryFn: () => api.get<ProjectDetail>(`/projects/${id}`, token ?? undefined),
    enabled: !!id && !!token,
    staleTime: 30_000,
  })
}

export function useJoinProject() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/projects/${id}/join`, {}, token ?? undefined),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['project', id] }),
  })
}

export function useLeaveProject() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}/leave`, token ?? undefined),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['project', id] }),
  })
}
