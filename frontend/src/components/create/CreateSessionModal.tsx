'use client'

import { useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useQueryClient } from '@tanstack/react-query'
import { api, API_BASE, refreshAccessToken } from '@/lib/api/client'

interface Props {
  onClose: () => void
  onCreated?: (id: string) => void
  circleId?: string
}

interface FormState {
  topic: string
  description: string
  mode: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  date: string
  time: string
  durationMinutes: string
  location: string
  meetingUrl: string
  language: string
  maxParticipants: string
  rules: string
  photo: File | null
  photoPreview: string | null
}

export function CreateSessionModal({ onClose, onCreated, circleId }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const qc = useQueryClient()
  const photoRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    topic: '', description: '', mode: 'ONLINE',
    date: '', time: '', durationMinutes: '60',
    location: '', meetingUrl: '', language: 'English',
    maxParticipants: '', rules: '',
    photo: null, photoPreview: null,
  })

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Photo too large (max 5 MB)', 'error'); return }
    const url = URL.createObjectURL(file)
    setForm(f => ({ ...f, photo: file, photoPreview: url }))
  }

  async function handleSubmit() {
    if (!form.topic.trim()) { showToast('Topic is required', 'error'); return }
    if (!form.date || !form.time) { showToast('Date and time are required', 'error'); return }
    if (!token) { showToast('Sign in to create a session', 'info'); return }
    setSubmitting(true)
    try {
      let photoUrl: string | null = null
      if (form.photo) {
        const fd = new FormData()
        fd.append('file', form.photo)
        let upRes = await fetch(`${API_BASE}/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
        if (upRes.status === 401) {
          const newToken = await refreshAccessToken()
          if (newToken) upRes = await fetch(`${API_BASE}/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${newToken}` }, body: fd })
        }
        if (upRes.ok) { const d = await upRes.json(); photoUrl = d.url }
      }
      const startsAt = new Date(`${form.date}T${form.time}`).toISOString()
      const body: Record<string, unknown> = {
        topic: form.topic.trim(),
        description: form.description.trim() || null,
        mode: form.mode,
        startsAt,
        durationMinutes: parseInt(form.durationMinutes, 10) || 60,
        location: form.location.trim() || null,
        meetingUrl: form.meetingUrl.trim() || null,
        language: form.language.trim() || 'English',
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : null,
        rules: form.rules.trim() || null,
        photoUrl,
        circleId: circleId ?? null,
      }
      const created = await api.post<{ id: string }>('/sessions', body, token)
      qc.invalidateQueries({ queryKey: ['sessions'] })
      showToast('Session created!', 'success')
      onCreated?.(created.id)
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to create session', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const label = (text: string, required?: boolean) => (
    <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
      {text}{required && <span style={{ color:'var(--error-500)' }}> *</span>}
    </label>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end', background:'rgba(47,42,36,0.48)' }} onClick={onClose}>
      <div
        style={{ width:'100%', maxHeight:'92vh', overflowY:'auto', background:'var(--surface-elevated)', borderRadius:'20px 20px 0 0', padding:'var(--space-6)', animation:'slideUp var(--duration-normal) var(--ease-out)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width:40, height:4, background:'var(--border-default)', borderRadius:2, margin:'0 auto var(--space-5)' }} />
        <h2 style={{ fontSize:'var(--text-xl)', fontWeight:700, color:'var(--text-primary)', marginBottom:'var(--space-5)' }}>Schedule a Session</h2>

        {/* Photo */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', marginBottom:'var(--space-5)' }}>
          <button
            onClick={() => photoRef.current?.click()}
            style={{ width:80, height:80, borderRadius:'var(--radius-xl)', border:'2px dashed var(--border-default)', background: form.photoPreview ? 'transparent' : 'var(--surface-sunken)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', flexShrink:0 }}
          >
            {form.photoPreview
              ? <img src={form.photoPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <i className="fa-solid fa-image" style={{ fontSize:24, color:'var(--text-tertiary)' }} />}
          </button>
          <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
          <div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-primary)' }}>Session Cover</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginTop:2 }}>Optional · JPG, PNG up to 5 MB</div>
            <button className="link-btn" style={{ fontSize:'var(--text-xs)', marginTop:4 }} onClick={() => photoRef.current?.click()}>Upload</button>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
          <div>
            {label('Topic', true)}
            <input className="input" placeholder="e.g. Introduction to Vipassana" value={form.topic} onChange={e => set('topic', e.target.value)} />
          </div>

          <div>
            {label('Description')}
            <textarea className="input" rows={3} placeholder="What will participants learn or discuss?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Mode */}
          <div>
            {label('Format', true)}
            <div style={{ display:'flex', gap:'var(--space-2)' }}>
              {(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => set('mode', m)}
                  style={{
                    flex:1, padding:'var(--space-2)', borderRadius:'var(--radius-lg)', border: form.mode === m ? '2px solid var(--saffron-500)' : '1.5px solid var(--border-default)',
                    background: form.mode === m ? 'var(--saffron-50)' : 'var(--surface-bg)', cursor:'pointer', fontSize:'var(--text-xs)', fontWeight: form.mode === m ? 600 : 400, color: form.mode === m ? 'var(--saffron-700)' : 'var(--text-secondary)', transition:'all var(--duration-fast)',
                  }}
                >
                  {m === 'ONLINE' ? 'Online' : m === 'IN_PERSON' ? 'In-Person' : 'Hybrid'}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
            <div>
              {label('Date', true)}
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              {label('Time', true)}
              <input className="input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          {/* Duration + Language */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
            <div>
              {label('Duration')}
              <select className="input" value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)} style={{ cursor:'pointer' }}>
                {[30, 45, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d < 60 ? `${d} min` : `${d/60} hr${d > 60 ? 's' : ''}`}</option>)}
              </select>
            </div>
            <div>
              {label('Language')}
              <input className="input" placeholder="English" value={form.language} onChange={e => set('language', e.target.value)} />
            </div>
          </div>

          {/* Location / URL depending on mode */}
          {(form.mode === 'IN_PERSON' || form.mode === 'HYBRID') && (
            <div>
              {label('Location')}
              <input className="input" placeholder="e.g. Ambedkar Bhavan, Nagpur" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          )}
          {(form.mode === 'ONLINE' || form.mode === 'HYBRID') && (
            <div>
              {label('Meeting URL')}
              <input className="input" placeholder="https://meet.google.com/…" type="url" value={form.meetingUrl} onChange={e => set('meetingUrl', e.target.value)} />
            </div>
          )}

          <div>
            {label('Max Participants')}
            <input className="input" type="number" min="2" max="500" placeholder="Unlimited" value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} />
          </div>

          <div>
            {label('Session Rules / Guidelines')}
            <textarea
              className="input"
              rows={3}
              placeholder={"e.g.\n1. Camera on preferred\n2. Mute when not speaking\n3. Questions in chat"}
              value={form.rules}
              onChange={e => set('rules', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display:'flex', gap:'var(--space-3)', marginTop:'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSubmit} disabled={submitting || !form.topic.trim() || !form.date || !form.time}>
            {submitting ? <><div className="spinner spinner-sm" style={{ marginRight:8 }} />Scheduling…</> : 'Schedule Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
