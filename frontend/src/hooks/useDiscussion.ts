'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

export type DiscussionEntityType = 'course' | 'resource' | 'study-circle' | 'project'

export interface DiscussionPost {
  id: string
  threadId: string
  authorId: string
  content: string
  parentId: string | null
  createdAt: string
  author: { id: string; displayName: string; profilePhoto: string | null }
}

interface DiscussionResponse {
  threadId: string
  posts: DiscussionPost[]
}

export function useDiscussionThread(entityType: DiscussionEntityType, entityId: string | null) {
  const { token } = useAuthStore()
  return useQuery<DiscussionResponse>({
    queryKey: ['discussion', entityType, entityId],
    queryFn: () => api.get<DiscussionResponse>(`/discussions/${entityType}/${entityId}`, token ?? undefined),
    enabled: !!entityId,
    staleTime: 20_000,
  })
}

export function usePostDiscussionMessage(entityType: DiscussionEntityType, entityId: string | null) {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api.post<DiscussionPost>(`/discussions/${entityType}/${entityId}`, { content }, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discussion', entityType, entityId] }),
  })
}

export function useDeleteDiscussionPost(entityType: DiscussionEntityType, entityId: string | null) {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => api.delete(`/discussions/posts/${postId}`, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discussion', entityType, entityId] }),
  })
}
