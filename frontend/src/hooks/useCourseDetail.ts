'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

export interface CourseLesson {
  id: string
  sequence: number
  resource: { id: string; type: string; title: string; url: string; thumbnailUrl: string | null; durationSecs: number | null } | null
}

export interface CourseDetail {
  id: string
  title: string
  description: string | null
  tradition: string | null
  language: string | null
  instructor: { id: string; displayName: string; profilePhoto: string | null } | null
  lessons: CourseLesson[]
  _count: { lessons: number; enrollments: number }
  isEnrolled: boolean
}

export function useCourseDetail(id: string | null) {
  const { token } = useAuthStore()
  return useQuery<CourseDetail>({
    queryKey: ['course', id],
    queryFn: () => api.get<CourseDetail>(`/courses/${id}`, token ?? undefined),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useEnrollCourse() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/courses/${id}/enroll`, {}, token ?? undefined),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['course', id] }),
  })
}

export function useUnenrollCourse() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}/enroll`, token ?? undefined),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['course', id] }),
  })
}
