'use client'

import { useState } from 'react'
import { useUiStore } from '@/stores/ui'
import { useCreateCircle } from '@/hooks/useCircleDetail'

interface Props {
  associationId: string
  onClose: () => void
  onCreated?: (id: string) => void
}

export function CreateCircleModal({ associationId, onClose, onCreated }: Props) {
  const { showToast } = useUiStore()
  const createCircle = useCreateCircle()
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleDescription, setScheduleDescription] = useState('')

  async function handleSubmit() {
    if (!topic.trim()) { showToast('Topic is required', 'error'); return }
    try {
      const created = await createCircle.mutateAsync({
        associationId,
        topic: topic.trim(),
        description: description.trim() || undefined,
        scheduleDescription: scheduleDescription.trim() || undefined,
      })
      showToast('Study circle created!', 'success')
      onCreated?.(created.id)
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to create study circle', 'error')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'flex', alignItems: 'flex-end', background: 'rgba(47,42,36,0.48)' }} onClick={onClose}>
      <div
        style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', background: 'var(--surface-elevated)', borderRadius: '20px 20px 0 0', padding: 'var(--space-6)', animation: 'slideUp var(--duration-normal) var(--ease-out)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: 'var(--border-default)', borderRadius: 2, margin: '0 auto var(--space-5)' }} />
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-5)' }}>New Study Circle</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Topic <span style={{ color: 'var(--error-500)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Weekly Dhammapada Study" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Description</label>
            <textarea className="input" rows={3} placeholder="What will this circle explore?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Schedule</label>
            <input className="input" placeholder="e.g. Sundays, 6pm IST" value={scheduleDescription} onChange={(e) => setScheduleDescription(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={createCircle.isPending}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={createCircle.isPending || !topic.trim()}
          >
            {createCircle.isPending ? <><div className="spinner spinner-sm" style={{ marginRight: 8 }} />Creating…</> : 'Create Circle'}
          </button>
        </div>
      </div>
    </div>
  )
}
