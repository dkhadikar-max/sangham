'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Tradition } from '@/types'

// Must match the backend's Tradition / AssociationCategory enums exactly —
// selecting a value outside these fails validation on submit.
const TRADITIONS: Tradition[] = ['THERAVADA', 'MAHAYANA', 'VAJRAYANA', 'NAVAYANA', 'MULTIPLE', 'OTHER']
const CATEGORIES = [
  { value: 'TEMPLE', label: 'Temple' },
  { value: 'NGO', label: 'NGO' },
  { value: 'STUDY_GROUP', label: 'Study Group' },
  { value: 'AMBEDKARITE_SANGHA', label: 'Ambedkarite Sangha' },
  { value: 'UNIVERSITY_CLUB', label: 'University Club' },
  { value: 'NATIONAL_FEDERATION', label: 'National Federation' },
  { value: 'INTERNATIONAL_BODY', label: 'International Body' },
]

interface Props {
  onClose: () => void
  onCreated?: (id: string) => void
}

interface FormState {
  name: string
  description: string
  tradition: string
  category: string
  city: string
  country: string
  website: string
}

export function CreateSanghaModal({ onClose, onCreated }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', description: '', tradition: '', category: '',
    city: '', country: '', website: '',
  })

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    if (!form.tradition) { showToast('Please select a tradition', 'error'); return }
    if (!form.category) { showToast('Please select a category', 'error'); return }
    if (!form.country.trim()) { showToast('Country is required', 'error'); return }
    if (!token) { showToast('Sign in to create a Sangha', 'info'); return }
    setSubmitting(true)
    try {
      let website: string | null = null
      if (form.website.trim()) {
        website = form.website.trim().startsWith('http') ? form.website.trim() : `https://${form.website.trim()}`
      }
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        tradition: form.tradition,
        category: form.category,
        city: form.city.trim() || null,
        country: form.country.trim(),
        website,
      }
      const created = await api.post<{ id: string }>('/associations', body, token)
      qc.invalidateQueries({ queryKey: ['associations'] })
      qc.invalidateQueries({ queryKey: ['associations-mine'] })
      showToast(`${form.name} created!`, 'success')
      onCreated?.(created.id)
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to create Sangha', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end', background:'rgba(47,42,36,0.48)' }} onClick={onClose}>
      <div
        style={{ width:'100%', maxHeight:'92vh', overflowY:'auto', background:'var(--surface-elevated)', borderRadius:'20px 20px 0 0', padding:'var(--space-6)', animation:'slideUp var(--duration-normal) var(--ease-out)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width:40, height:4, background:'var(--border-default)', borderRadius:2, margin:'0 auto var(--space-5)' }} />

        <h2 style={{ fontSize:'var(--text-xl)', fontWeight:700, color:'var(--text-primary)', marginBottom:'var(--space-5)' }}>Create a Sangha</h2>

        {/* Fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
              Name <span style={{ color:'var(--error-500)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Nagpur Dhamma Circle" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Description</label>
            <textarea className="input" rows={3} placeholder="What is this Sangha about? What does it offer?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
                Tradition <span style={{ color:'var(--error-500)' }}>*</span>
              </label>
              <select className="input" value={form.tradition} onChange={e => set('tradition', e.target.value)} style={{ cursor:'pointer' }}>
                <option value="">Select…</option>
                {TRADITIONS.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
                Category <span style={{ color:'var(--error-500)' }}>*</span>
              </label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)} style={{ cursor:'pointer' }}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>City</label>
              <input className="input" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
                Country <span style={{ color:'var(--error-500)' }}>*</span>
              </label>
              <input className="input" placeholder="e.g. India" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Website</label>
            <input className="input" placeholder="example.com" value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'var(--space-3)', marginTop:'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex:2 }}
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim() || !form.tradition || !form.category || !form.country.trim()}
          >
            {submitting ? <><div className="spinner spinner-sm" style={{ marginRight:8 }} />Creating…</> : 'Create Sangha'}
          </button>
        </div>
      </div>
    </div>
  )
}
