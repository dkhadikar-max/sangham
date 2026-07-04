'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import type {
  AssociationSummary,
  AssociationDetail,
  AssociationMembership,
  CommunityCourse,
  CommunityResource,
  CommunityProject,
  CommunityCircle,
} from '@/types'

export type AssociationFilter = {
  name?: string
  tradition?: string
  category?: string
}

export function useAssociations(filter?: AssociationFilter) {
  const qs = filter ? new URLSearchParams(filter as Record<string, string>).toString() : ''
  return useQuery({
    queryKey: ['associations', filter],
    queryFn: async () => {
      const data = await api.get<AssociationSummary[]>(`/associations${qs ? '?' + qs : ''}`)
      return Array.isArray(data) ? data : []
    },
    staleTime: 60_000,
    retry: 1,
  })
}

export function useMyAssociations() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['associations-mine'],
    queryFn: async () => {
      const data = await api.get<AssociationSummary[]>('/associations/mine', token ?? undefined)
      return Array.isArray(data) ? data : []
    },
    enabled: !!token,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useAssociation(id: string | null) {
  return useQuery({
    queryKey: ['association', id],
    queryFn: () => api.get<AssociationDetail>(`/associations/${id}`),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useAssociationMembership(id: string | null) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['association-membership', id],
    queryFn: async () => {
      try {
        return await api.get<AssociationMembership>(`/associations/${id}/membership`, token ?? undefined)
      } catch {
        return { isMember: false, memberRole: null }
      }
    },
    enabled: !!id && !!token,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useJoinAssociation() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/associations/${id}/join`, {}, token ?? undefined),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['association-membership', id] })
      qc.invalidateQueries({ queryKey: ['associations-mine'] })
    },
  })
}

export function useLeaveAssociation() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/associations/${id}/leave`, token ?? undefined),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['association-membership', id] })
      qc.invalidateQueries({ queryKey: ['associations-mine'] })
    },
  })
}

export function useJoinAssociationDirect() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/associations/${id}/join`, {}, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['associations-mine'] })
    },
  })
}

export function useCommunityLearning(assocId: string | null) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['community-learning', assocId],
    queryFn: async () => {
      const [coursesRaw, resourcesRaw] = await Promise.all([
        api.get<{ data?: CommunityCourse[] } | CommunityCourse[]>(
          `/courses?associationId=${assocId}&status=PUBLISHED&limit=10`,
          token ?? undefined,
        ),
        api.get<{ data?: CommunityResource[] } | CommunityResource[]>(
          `/resources?associationId=${assocId}&limit=10`,
          token ?? undefined,
        ),
      ])
      const courses: CommunityCourse[] = Array.isArray(coursesRaw)
        ? coursesRaw
        : ((coursesRaw as { data?: CommunityCourse[] }).data ?? [])
      const resources: CommunityResource[] = Array.isArray(resourcesRaw)
        ? resourcesRaw
        : ((resourcesRaw as { data?: CommunityResource[] }).data ?? [])
      return { courses, resources }
    },
    enabled: false,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useCommunityProjects(assocId: string | null) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['community-projects', assocId],
    queryFn: async () => {
      const raw = await api.get<{ data?: CommunityProject[] } | CommunityProject[]>(
        `/projects?associationId=${assocId}&status=OPEN&limit=10`,
        token ?? undefined,
      )
      return Array.isArray(raw) ? raw : ((raw as { data?: CommunityProject[] }).data ?? [])
    },
    enabled: false,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useCommunityCircles(assocId: string | null) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['community-circles', assocId],
    queryFn: async () => {
      const raw = await api.get<{ data?: CommunityCircle[] } | CommunityCircle[]>(
        `/study-circles?associationId=${assocId}&limit=10`,
        token ?? undefined,
      )
      return Array.isArray(raw) ? raw : ((raw as { data?: CommunityCircle[] }).data ?? [])
    },
    enabled: false,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useJoinCircle() {
  const { token } = useAuthStore()
  return useMutation({
    mutationFn: (circleId: string) => api.post(`/study-circles/${circleId}/join`, {}, token ?? undefined),
  })
}

export function useLeaveCircle() {
  const { token } = useAuthStore()
  return useMutation({
    mutationFn: (circleId: string) => api.delete(`/study-circles/${circleId}/leave`, token ?? undefined),
  })
}
