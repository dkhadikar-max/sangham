'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'RETREAT', label: 'Retreat' },
  { value: 'CEREMONY', label: 'Ceremony' },
  { value: 'TALK', label: 'Talk' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'PROTEST_MARCH', label: 'Protest / March' },
  { value: 'COMMUNITY_GATHERING', label: 'Community Gathering' },
  { value: 'DHAMMA_DIKSHA', label: 'Dhamma Diksha' },
  { value: 'CONVERSION_CEREMONY', label: 'Conversion Ceremony' },
  { value: 'AMBEDKAR_JAYANTI', label: 'Ambedkar Jayanti' },
]

interface Props {
  onClose: () => void
  onCreated?: (id: string) => void
  associationId?: string
}

interface FormState {
  title: string
  description: string
  eventType: string
  mode: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  date: string
  time: string
  locationName: string
  onlineUrl: string
  capacity: string
}

export function CreateEventModal({ onClose, onCreated, associationId }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    title: '', description: '', eventType: '', mode: 'ONLINE',
    date: '', time: '', locationName: '', onlineUrl: '', capacity: '',
  })

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return }
    if (!form.eventType) { showToast('Please select an event type', 'error'); return }
    if (!form.date || !form.time) { showToast('Date and time are required', 'error'); return }
    if (!token) { showToast('Sign in to create an event', 'info'); return }
    setSubmitting(true)
    try {
      const startsAt = new Date(`${form.date}T${form.time}`).toISOString()
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        eventType: form.eventType,
        startsAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locationName: (form.mode === 'IN_PERSON' || form.mode === 'HYBRID') ? (form.locationName.trim() || undefined) : undefined,
        onlineUrl: (form.mode === 'ONLINE' || form.mode === 'HYBRID') ? (form.onlineUrl.trim() || undefined) : undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : 0,
        associationId: associationId ?? undefined,
      }
      const created = await api.post<{ id: string }>('/events', body, token)
      qc.invalidateQueries({ queryKey: ['events'] })
      showToast(`${form.title} created!`, 'success')
      onCreated?.(created.id)
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to create event', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:65, display:'flex', alignItems:'flex-end', background:'rgba(47,42,36,0.48)' }} onClick={onClose}>
      <div
        style={{ width:'100%', maxHeight:'92vh', overflowY:'auto', background:'var(--surface-elevated)', borderRadius:'20px 20px 0 0', padding:'var(--space-6)', animation:'slideUp var(--duration-normal) var(--ease-out)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width:40, height:4, background:'var(--border-default)', borderRadius:2, margin:'0 auto var(--space-5)' }} />
        <h2 style={{ fontSize:'var(--text-xl)', fontWeight:700, color:'var(--text-primary)', marginBottom:'var(--space-5)' }}>Schedule an Event</h2>

        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
              Title <span style={{ color:'var(--error-500)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Full Moon Meditation Retreat" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Description</label>
            <textarea className="input" rows={3} placeholder="What should people expect?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
              Event Type <span style={{ color:'var(--error-500)' }}>*</span>
            </label>
            <select className="input" value={form.eventType} onChange={e => set('eventType', e.target.value)} style={{ cursor:'pointer' }}>
              <option value="">Select…</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Format</label>
            <div style={{ display:'flex', gap:'var(--space-2)' }}>
              {(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => set('mode', m)}
                  style={{
                    flex:1, padding:'var(--space-2)', borderRadius:'var(--radius-lg)', border: form.mode === m ? '2px solid var(--saffron-500)' : '1.5px solid var(--border-default)',
                    background: form.mode === m ? 'var(--saffron-50)' : 'var(--surface-bg)', cursor:'pointer', fontSize:'var(--text-xs)', fontWeight: form.mode === m ? 600 : 400, color: form.mode === m ? 'var(--saffron-700)' : 'var(--text-secondary)',
                  }}
                >
                  {m === 'ONLINE' ? 'Online' : m === 'IN_PERSON' ? 'In-Person' : 'Hybrid'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
                Date <span style={{ color:'var(--error-500)' }}>*</span>
              </label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
                Time <span style={{ color:'var(--error-500)' }}>*</span>
              </label>
              <input className="input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          {(form.mode === 'IN_PERSON' || form.mode === 'HYBRID') && (
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Location</label>
              <input className="input" placeholder="e.g. Ambedkar Bhavan, Nagpur" value={form.locationName} onChange={e => set('locationName', e.target.value)} />
            </div>
          )}
          {(form.mode === 'ONLINE' || form.mode === 'HYBRID') && (
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Meeting URL</label>
              <input className="input" type="url" placeholder="https://meet.google.com/…" value={form.onlineUrl} onChange={e => set('onlineUrl', e.target.value)} />
            </div>
          )}

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Capacity</label>
            <input className="input" type="number" min="0" placeholder="Unlimited" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
          </div>
        </div>

        <div style={{ display:'flex', gap:'var(--space-3)', marginTop:'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex:2 }}
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !form.eventType || !form.date || !form.time}
          >
            {submitting ? <><div className="spinner spinner-sm" style={{ marginRight:8 }} />Creating…</> : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  )
}
