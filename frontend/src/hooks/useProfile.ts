'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api, API_BASE, refreshAccessToken } from '@/lib/api/client'
import type { UserProfile, FeedPost, EventItem, DiscoverProject } from '@/types'

async function uploadAvatar(file: File, token: string | null, isRetry = false): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/uploads/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (res.status === 401 && token && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) return uploadAvatar(file, newToken, true)
  }
  if (!res.ok) throw new Error('Upload failed')
  return res.json() as Promise<{ url: string }>
}

export function useUploadAvatar() {
  const { token, updateUser } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file, token ?? null),
    onSuccess: (data) => {
      updateUser({ profilePhoto: data.url })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

async function fetchProfile(userId: string, token: string | null): Promise<UserProfile> {
  return api.get<UserProfile>(`/users/${userId}`, token ?? undefined)
}

async function fetchUserPosts(userId: string, token: string | null): Promise<FeedPost[]> {
  const data = await api.get<FeedPost[] | { data: FeedPost[] }>(`/users/${userId}/posts?limit=10`, token ?? undefined)
  return Array.isArray(data) ? data : (data.data ?? [])
}

export function useUserProfile(userId: string | null) {
  const { token } = useAuthStore()
  return useQuery<UserProfile>({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchProfile(userId!, token),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useUserPosts(userId: string | null) {
  const { token } = useAuthStore()
  return useQuery<FeedPost[]>({
    queryKey: ['user-posts', userId],
    queryFn: () => fetchUserPosts(userId!, token),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useSaveProfile() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => api.put('/users/me', data, token ?? undefined),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}
