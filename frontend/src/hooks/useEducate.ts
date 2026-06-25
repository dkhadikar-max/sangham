'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'

export interface EducateLesson {
  title: string
  duration: number
  overview: string
  concepts: string[]
  actionTask: string
  reflection: string
}

export interface EducatePhase {
  title: string
  lessons: EducateLesson[]
}

export interface EducatePath {
  id: string
  slug: string
  domain: string
  title: string
  tagline: string
  description: string
  circleTag: string
  sortOrder: number
  phases: EducatePhase[]
}

export interface EducateLessonProgress {
  lessonKey: string
  exerciseDone: boolean
}

export interface EducateEnrollment {
  id: string
  pathId: string
  currentPhase: number
  currentLesson: number
  percentComplete: number
  streak: number
  lastActivityAt: string
  lessonProgress: EducateLessonProgress[]
  path: Pick<EducatePath, 'slug' | 'title' | 'tagline' | 'domain' | 'phases'>
}

export interface EducateReputation {
  level: string
  totalLessons: number
  totalPaths: number
  totalExercises: number
  longestStreak: number
}

export function useEducatePaths() {
  return useQuery<EducatePath[]>({
    queryKey: ['educate-paths'],
    queryFn: () => api.get<EducatePath[]>('/educate/paths'),
    staleTime: 600_000,
    retry: 1,
  })
}

export function useMyEnrollments() {
  const { token } = useAuthStore()
  return useQuery<EducateEnrollment[]>({
    queryKey: ['educate-my-paths'],
    queryFn: () => api.get<EducateEnrollment[]>('/educate/my-paths', token ?? undefined),
    enabled: !!token,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useReputation() {
  const { token } = useAuthStore()
  return useQuery<EducateReputation>({
    queryKey: ['educate-reputation'],
    queryFn: () => api.get<EducateReputation>('/educate/reputation', token ?? undefined),
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  })
}

export function useEnrollPath() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) =>
      api.post<EducateEnrollment>(`/educate/paths/${slug}/enroll`, {}, token ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['educate-my-paths'] })
    },
  })
}

export function useMarkLesson() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, lessonKey, exerciseDone }: { enrollmentId: string; lessonKey: string; exerciseDone?: boolean }) =>
      api.post<EducateEnrollment>(
        `/educate/enrollments/${enrollmentId}/lesson`,
        { lessonKey, exerciseDone: !!exerciseDone },
        token ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['educate-my-paths'] })
      qc.invalidateQueries({ queryKey: ['educate-reputation'] })
    },
  })
}

export function useAITutor() {
  const { token } = useAuthStore()
  return useMutation({
    mutationFn: (body: {
      action: 'explain' | 'quiz' | 'summarize' | 'exercise' | 'simplify'
      pathSlug: string
      phaseIndex: number
      lessonIndex: number
      lessonTitle: string
      concepts: string[]
      userQuestion?: string
      completedLessons: string[]
      percentComplete: number
    }) =>
      api.post<{ action: string; response: string }>('/educate/ai-tutor', body, token ?? undefined),
  })
}
