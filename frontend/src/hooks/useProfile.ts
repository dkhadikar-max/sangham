'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import type { UserProfile, FeedPost, EventItem, DiscoverProject } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchProfile(userId: string, token: string | null): Promise<UserProfile> {
  const res = await fetch(`${API}/users/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to load profile')
  return res.json()
}

async function fetchUserPosts(userId: string, token: string | null): Promise<FeedPost[]> {
  const res = await fetch(`${API}/users/${userId}/posts?limit=10`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to load posts')
  const data = await res.json()
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
    mutationFn: async (data: Partial<UserProfile>) => {
      const res = await fetch(`${API}/users/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save profile')
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}
