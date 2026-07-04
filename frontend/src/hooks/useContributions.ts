'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface ContributionLeader {
  totalScore: number
  eventsHosted: number
  sessionsHosted: number
  user: { id: string; displayName: string; profilePhoto: string | null; traditions: string[]; isVerifiedClergy: boolean; isVerifiedTeacher: boolean }
}

export function useContributionLeaderboard() {
  return useQuery<ContributionLeader[]>({
    queryKey: ['contributions-leaderboard'],
    queryFn: () => api.get<ContributionLeader[]>('/contributions/leaderboard'),
    staleTime: 60_000,
  })
}
