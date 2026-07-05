'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api/client'

export interface CourseLesson {
  id: string
  title: string
  content: string | null
  sequence: number
  resource: { id: string; type: string; title: string; url: string; thumbnailUrl: string | null; durationSecs: number | null } | null
}

export interface CourseDetail {
  id: string
  title: string
  description: string | null
  tradition: string | null
  language: string | null
  status: string
  instructor: { id: string; displayName: string; profilePhoto: string | null } | null
  lessons: CourseLesson[]
  _count: { lessons: number; enrollments: number }
  isEnrolled: boolean
  isInstructor: boolean
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

export function useCreateCourse() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { ownerType: 'COMMUNITY'; associationId: string; title: string; description?: string; language?: string }) =>
      api.post<{ id: string }>('/courses', input, token ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-learning'] }),
  })
}

export function useAddLesson() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, title, content }: { courseId: string; title: string; content?: string }) =>
      api.post(`/courses/${courseId}/lessons`, { title, content }, token ?? undefined),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['course', vars.courseId] }),
  })
}

export function useSetCourseStatus() {
  const { token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }) =>
      api.put(`/courses/${id}`, { status }, token ?? undefined),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['course', vars.id] })
      qc.invalidateQueries({ queryKey: ['community-learning'] })
    },
  })
}
