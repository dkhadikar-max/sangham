'use client'

import { useState } from 'react'
import { useUiStore } from '@/stores/ui'
import { useCreateProject } from '@/hooks/useProjectDetail'

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'TRANSLATION', label: 'Translation' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'ENVIRONMENT', label: 'Environment' },
  { value: 'SOCIAL_IMPACT', label: 'Social Impact' },
  { value: 'COMMUNITY_BUILDING', label: 'Community Building' },
  { value: 'ARTS_CULTURE', label: 'Arts & Culture' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
]

interface Props {
  onClose: () => void
  onCreated?: (id: string) => void
  associationId?: string
}

export function CreateProjectModal({ onClose, onCreated, associationId }: Props) {
  const { showToast } = useUiStore()
  const createProject = useCreateProject()
  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [skillsNeeded, setSkillsNeeded] = useState('')
  const [participantsNeeded, setParticipantsNeeded] = useState('')

  async function handleSubmit() {
    if (!title.trim()) { showToast('Title is required', 'error'); return }
    if (!purpose.trim()) { showToast('Purpose is required', 'error'); return }
    if (!category) { showToast('Please select a category', 'error'); return }
    try {
      const created = await createProject.mutateAsync({
        title: title.trim(),
        purpose: purpose.trim(),
        category,
        description: description.trim() || undefined,
        skillsNeeded: skillsNeeded.trim() ? skillsNeeded.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        participantsNeeded: participantsNeeded ? parseInt(participantsNeeded, 10) : undefined,
        associationId,
      })
      showToast('Project created!', 'success')
      onCreated?.(created.id)
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to create project', 'error')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'flex', alignItems: 'flex-end', background: 'rgba(47,42,36,0.48)' }} onClick={onClose}>
      <div
        style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', background: 'var(--surface-elevated)', borderRadius: '20px 20px 0 0', padding: 'var(--space-6)', animation: 'slideUp var(--duration-normal) var(--ease-out)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: 'var(--border-default)', borderRadius: 2, margin: '0 auto var(--space-5)' }} />
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-5)' }}>New Project</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Title <span style={{ color: 'var(--error-500)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Translate the Dhammapada to Marathi" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Purpose <span style={{ color: 'var(--error-500)' }}>*</span>
            </label>
            <input className="input" placeholder="One line — why does this matter?" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Category <span style={{ color: 'var(--error-500)' }}>*</span>
            </label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Description</label>
            <textarea className="input" rows={3} placeholder="What will collaborators actually do?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Skills Needed</label>
              <input className="input" placeholder="e.g. Marathi, editing" value={skillsNeeded} onChange={(e) => setSkillsNeeded(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Collaborators Needed</label>
              <input className="input" type="number" min="0" placeholder="Unlimited" value={participantsNeeded} onChange={(e) => setParticipantsNeeded(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={createProject.isPending}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={createProject.isPending || !title.trim() || !purpose.trim() || !category}
          >
            {createProject.isPending ? <><div className="spinner spinner-sm" style={{ marginRight: 8 }} />Creating…</> : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
