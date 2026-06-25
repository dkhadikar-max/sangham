'use client'

import { useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useQueryClient } from '@tanstack/react-query'
import type { Tradition } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const TRADITIONS: Tradition[] = ['THERAVADA', 'MAHAYANA', 'VAJRAYANA', 'NAVAYANA', 'ZEN', 'PURE_LAND', 'TIBETAN', 'MULTIPLE', 'OTHER']
const CATEGORIES = [
  { value: 'TEMPLE', label: 'Temple' },
  { value: 'AMBEDKARITE_SANGHA', label: 'Ambedkarite Sangha' },
  { value: 'STUDY_GROUP', label: 'Study Group' },
  { value: 'MEDITATION_CENTER', label: 'Meditation Center' },
  { value: 'DHARMA_CENTER', label: 'Dharma Center' },
  { value: 'ONLINE_COMMUNITY', label: 'Online Community' },
  { value: 'YOUTH_GROUP', label: 'Youth Group' },
  { value: 'OTHER', label: 'Other' },
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
  rules: string
  photo: File | null
  photoPreview: string | null
}

export function CreateSanghaModal({ onClose, onCreated }: Props) {
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const qc = useQueryClient()
  const photoRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', description: '', tradition: '', category: '',
    city: '', country: '', website: '', rules: '',
    photo: null, photoPreview: null,
  })

  function set(field: keyof FormState, value: string) {
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
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    if (!token) { showToast('Sign in to create a Sangha', 'info'); return }
    setSubmitting(true)
    try {
      let photoUrl: string | null = null
      if (form.photo) {
        const fd = new FormData()
        fd.append('file', form.photo)
        const upRes = await fetch(`${API}/upload/media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
        if (upRes.ok) { const d = await upRes.json(); photoUrl = d.url }
      }
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        tradition: form.tradition || null,
        category: form.category || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        website: form.website.trim() || null,
        rules: form.rules.trim() || null,
        photoUrl,
      }
      const res = await fetch(`${API}/associations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const created = await res.json()
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

        {/* Photo */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', marginBottom:'var(--space-5)' }}>
          <button
            onClick={() => photoRef.current?.click()}
            style={{ width:80, height:80, borderRadius:'var(--radius-2xl)', border:'2px dashed var(--border-default)', background: form.photoPreview ? 'transparent' : 'var(--surface-sunken)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', flexShrink:0 }}
          >
            {form.photoPreview
              ? <img src={form.photoPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <i className="fa-solid fa-camera" style={{ fontSize:24, color:'var(--text-tertiary)' }} />}
          </button>
          <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
          <div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-primary)' }}>Sangha Photo</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginTop:2 }}>Optional · JPG, PNG up to 5 MB</div>
            <button className="link-btn" style={{ fontSize:'var(--text-xs)', marginTop:4 }} onClick={() => photoRef.current?.click()}>Upload photo</button>
          </div>
        </div>

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
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Tradition</label>
              <select className="input" value={form.tradition} onChange={e => set('tradition', e.target.value)} style={{ cursor:'pointer' }}>
                <option value="">Select…</option>
                {TRADITIONS.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Category</label>
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
              <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Country</label>
              <input className="input" placeholder="Country" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>Website</label>
            <input className="input" placeholder="https://…" type="url" value={form.website} onChange={e => set('website', e.target.value)} />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-1)' }}>
              Community Rules
            </label>
            <textarea
              className="input"
              rows={4}
              placeholder={"List your Sangha's guidelines, one per line:\n1. Be respectful\n2. Stay on topic\n3. No spam"}
              value={form.rules}
              onChange={e => set('rules', e.target.value)}
            />
            <p style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginTop:4 }}>Members will see these rules when joining.</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'var(--space-3)', marginTop:'var(--space-6)' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
            {submitting ? <><div className="spinner spinner-sm" style={{ marginRight:8 }} />Creating…</> : 'Create Sangha'}
          </button>
        </div>
      </div>
    </div>
  )
}
