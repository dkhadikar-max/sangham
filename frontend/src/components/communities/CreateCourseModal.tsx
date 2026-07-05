'use client'

import { useState } from 'react'
import { useUiStore } from '@/stores/ui'
import { useCreateCourse } from '@/hooks/useCourseDetail'

interface Props {
  associationId: string
  onClose: () => void
  onCreated?: (id: string) => void
}

export function CreateCourseModal({ associationId, onClose, onCreated }: Props) {
  const { showToast } = useUiStore()
  const createCourse = useCreateCourse()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit() {
    if (!title.trim()) { showToast('Title is required', 'error'); return }
    try {
      const created = await createCourse.mutateAsync({
        ownerType: 'COMMUNITY',
        associationId,
        title: title.trim(),
        description: description.trim() || undefined,
      })
      showToast('Course created as a draft — add lessons, then publish', 'success')
      onCreated?.(created.id)
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to create course', 'error')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'flex', alignItems: 'flex-end', background: 'rgba(47,42,36,0.48)' }} onClick={onClose}>
      <div
        style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', background: 'var(--surface-elevated)', borderRadius: '20px 20px 0 0', padding: 'var(--space-6)', animation: 'slideUp var(--duration-normal) var(--ease-out)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: 'var(--border-default)', borderRadius: 2, margin: '0 auto var(--space-5)' }} />
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>New Course</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-5)' }}>
          Starts as a draft. Add lessons, then publish when it's ready for others to see.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Title <span style={{ color: 'var(--error-500)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Foundations of Mindfulness" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Description</label>
            <textarea className="input" rows={3} placeholder="What will students learn?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={createCourse.isPending}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={createCourse.isPending || !title.trim()}
          >
            {createCourse.isPending ? <><div className="spinner spinner-sm" style={{ marginRight: 8 }} />Creating…</> : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  )
}
