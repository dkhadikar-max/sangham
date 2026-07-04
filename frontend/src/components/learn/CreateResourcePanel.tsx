'use client'

import { useState } from 'react'
import { useCreateResource, type ResourceType } from '@/hooks/useResources'
import { useUiStore } from '@/stores/ui'

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'YOUTUBE_VIDEO',      label: 'YouTube Video' },
  { value: 'YOUTUBE_PLAYLIST',   label: 'YouTube Playlist' },
  { value: 'PDF',                label: 'PDF' },
  { value: 'ARTICLE',            label: 'Article' },
  { value: 'RESEARCH_PAPER',     label: 'Research Paper' },
  { value: 'WORKSHOP_RECORDING', label: 'Workshop Recording' },
  { value: 'GUIDE',              label: 'Guide' },
  { value: 'BOOK_SUMMARY',       label: 'Book Summary' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'bn', label: 'Bengali' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'or', label: 'Odia' },
  { value: 'pi', label: 'Pali' },
  { value: 'sa', label: 'Sanskrit' },
]

const DURATION_TYPES = new Set<ResourceType>(['YOUTUBE_VIDEO', 'WORKSHOP_RECORDING'])
const YOUTUBE_TYPES = new Set<ResourceType>(['YOUTUBE_VIDEO', 'YOUTUBE_PLAYLIST'])

function youtubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

interface Props {
  onClose: () => void
}

export function CreateResourcePanel({ onClose }: Props) {
  const { showToast } = useUiStore()
  const createResource = useCreateResource()

  const [form, setForm] = useState({
    type: 'ARTICLE' as ResourceType,
    title: '',
    url: '',
    description: '',
    creator: '',
    durationMinutes: '',
    language: 'en',
  })

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { showToast('Title is required', 'error'); return }
    if (!form.url.trim()) { showToast('A link is required', 'error'); return }

    try {
      await createResource.mutateAsync({
        type: form.type,
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim() || undefined,
        creator: form.creator.trim() || undefined,
        durationSecs: form.durationMinutes ? Number(form.durationMinutes) * 60 : undefined,
        language: form.language,
        thumbnailUrl: YOUTUBE_TYPES.has(form.type) && youtubeVideoId(form.url)
          ? `https://img.youtube.com/vi/${youtubeVideoId(form.url)}/mqdefault.jpg`
          : undefined,
      })
      showToast('Resource shared with the community', 'success')
      onClose()
    } catch (err) {
      showToast((err as Error).message || 'Failed to share resource', 'error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)',
    borderRadius: 8, fontSize: '0.9rem', background: 'var(--surface)',
    color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em',
  }
  const fieldStyle: React.CSSProperties = { marginBottom: 16 }

  return (
    <>
      <div className="panel-comm" style={{ zIndex: 60 }}>
        <div className="panel-header">
          <button className="panel-back" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <span className="panel-title">Share a Resource</span>
        </div>

        <div className="panel-content" style={{ padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--saffron-50)', border: '1px solid var(--saffron-200)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--saffron-700)' }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: 8 }} />
            Link a video, article, PDF, or recording worth learning from. It'll appear in Resources for everyone to browse.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Type *</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value as ResourceType)}>
                {RESOURCE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="e.g. Introduction to Anapanasati"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Link *</label>
              <input
                type="url"
                style={inputStyle}
                placeholder="https://…"
                value={form.url}
                onChange={e => set('url', e.target.value)}
                required
              />
              {YOUTUBE_TYPES.has(form.type) && youtubeVideoId(form.url) && (
                <img
                  src={`https://img.youtube.com/vi/${youtubeVideoId(form.url)}/mqdefault.jpg`}
                  alt=""
                  style={{ marginTop: 8, width: '100%', maxWidth: 320, borderRadius: 8, border: '1px solid var(--border-default)' }}
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Language</label>
                <select style={inputStyle} value={form.language} onChange={e => set('language', e.target.value)}>
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Creator / Author</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="Optional"
                  value={form.creator}
                  onChange={e => set('creator', e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>

            {DURATION_TYPES.has(form.type) && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Duration (minutes)</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="Optional"
                  value={form.durationMinutes}
                  onChange={e => set('durationMinutes', e.target.value)}
                  min={0}
                />
              </div>
            )}

            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="What makes this worth sharing?"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                maxLength={1000}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={createResource.isPending}
            >
              {createResource.isPending ? (
                <><span className="spinner spinner-sm" style={{ marginRight: 8 }} />Sharing…</>
              ) : (
                <><i className="fa-solid fa-share-nodes" style={{ marginRight: 8 }} />Share Resource</>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
