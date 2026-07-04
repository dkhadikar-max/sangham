'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

export type ProfileVisibility = 'PUBLIC' | 'COMMUNITY' | 'CONNECTIONS' | 'ANONYMOUS'
export type MessagingPermission = 'EVERYONE' | 'CONNECTIONS_ONLY' | 'NOBODY'
export type LocationVisibility = 'HIDDEN' | 'APPROXIMATE' | 'CITY_ONLY' | 'STATE_ONLY' | 'COUNTRY_ONLY'

export interface PrivacySettings {
  profileVisibility: ProfileVisibility
  messagingPermission: MessagingPermission
  locationVisibility: LocationVisibility
  activityVisibility: ProfileVisibility
  showInDiscovery: boolean
  anonymousBrowsing: boolean
}

const DEFAULTS: PrivacySettings = {
  profileVisibility: 'COMMUNITY',
  messagingPermission: 'CONNECTIONS_ONLY',
  locationVisibility: 'CITY_ONLY',
  activityVisibility: 'COMMUNITY',
  showInDiscovery: true,
  anonymousBrowsing: false,
}

async function fetchPrivacy(token: string | null): Promise<PrivacySettings> {
  const data = await api.get<Partial<PrivacySettings> & { defaults?: boolean }>('/privacy', token ?? undefined)
  return { ...DEFAULTS, ...data }
}

export function usePrivacySettings() {
  const { token } = useAuthStore()
  return useQuery<PrivacySettings>({
    queryKey: ['privacy-settings'],
    queryFn: () => fetchPrivacy(token),
    staleTime: 60_000,
  })
}

export function useSavePrivacySettings() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<PrivacySettings>) => api.put<PrivacySettings>('/privacy', data, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privacy-settings'] })
    },
  })
}
