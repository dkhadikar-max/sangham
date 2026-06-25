'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { useUploadMedia } from '@/hooks/useMessages'
import { useUiStore } from '@/stores/ui'

interface Props {
  onSend: (content: string, type: 'text' | 'link' | 'photo', mediaUrl?: string) => void
  disabled?: boolean
  encrypted?: boolean
}

const URL_RE = /https?:\/\/[^\s]+/

function detectType(text: string): 'text' | 'link' {
  return URL_RE.test(text.trim()) ? 'link' : 'text'
}

export function MessageInput({ onSend, disabled, encrypted }: Props) {
  const { showToast } = useUiStore()
  const upload = useUploadMedia()
  const [text, setText] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    const type = detectType(trimmed)
    onSend(trimmed, type)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { showToast('Photo too large (max 10 MB)', 'error'); return }
    setShowAttach(false)
    try {
      const url = await upload.mutateAsync(file)
      onSend('', 'photo', url)
    } catch {
      showToast('Photo upload failed', 'error')
    }
    e.target.value = ''
  }

  return (
    <div style={{ borderTop:'1px solid var(--border-subtle)', background:'var(--surface-elevated)', padding:'var(--space-2) var(--space-3)', flexShrink:0 }}>
      {/* Attach options */}
      {showAttach && (
        <div style={{ display:'flex', gap:'var(--space-2)', padding:'var(--space-2) 0', animation:'fadeInScale 150ms var(--ease-out)' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { fileRef.current?.click(); }}
            disabled={upload.isPending}
          >
            <i className="fa-solid fa-image" style={{ marginRight:4 }} />
            Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoSelect} />
        </div>
      )}

      <div style={{ display:'flex', alignItems:'flex-end', gap:'var(--space-2)' }}>
        {/* Attach button */}
        <button
          onClick={() => setShowAttach(v => !v)}
          style={{ width:40, height:40, borderRadius:'50%', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: showAttach ? 'var(--saffron-500)' : 'var(--text-tertiary)', flexShrink:0, transition:'color var(--duration-fast)' }}
          aria-label="Attach"
        >
          <i className="fa-solid fa-plus" style={{ fontSize:18 }} />
        </button>

        {/* Text input */}
        <div style={{ flex:1, position:'relative' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            disabled={disabled}
            rows={1}
            style={{
              width:'100%', background:'var(--surface-bg)', border:'1.5px solid var(--border-default)',
              borderRadius:20, padding:'10px 16px', fontSize:'var(--text-sm)', color:'var(--text-primary)',
              fontFamily:'var(--font-body)', outline:'none', resize:'none', lineHeight:1.4,
              boxSizing:'border-box', display:'block', maxHeight:120, overflowY:'auto',
              transition:'border-color var(--duration-fast)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--saffron-400)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          />
          {encrypted && (
            <i className="fa-solid fa-lock" title="End-to-end encrypted" style={{ position:'absolute', right:12, bottom:11, fontSize:10, color:'var(--saffron-400)', pointerEvents:'none' }} />
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{
            width:40, height:40, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center',
            cursor: text.trim() ? 'pointer' : 'default', flexShrink:0, transition:'all var(--duration-fast)',
            background: text.trim() ? 'linear-gradient(135deg,var(--saffron-500),var(--saffron-600))' : 'var(--surface-sunken)',
            color: text.trim() ? 'white' : 'var(--text-tertiary)',
          }}
          aria-label="Send"
        >
          <i className="fa-solid fa-paper-plane" style={{ fontSize:14 }} />
        </button>
      </div>

      {/* Upload pending */}
      {upload.isPending && (
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'var(--space-2) 0', fontSize:'var(--text-xs)', color:'var(--text-tertiary)' }}>
          <div className="spinner spinner-sm" />
          Uploading photo…
        </div>
      )}
    </div>
  )
}
