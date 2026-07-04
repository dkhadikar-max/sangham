'use client'

import { useState, useEffect } from 'react'
import { usePrivacySettings, useSavePrivacySettings, type PrivacySettings, type ProfileVisibility, type MessagingPermission, type LocationVisibility } from '@/hooks/usePrivacy'
import { useUiStore } from '@/stores/ui'

interface Props {
  onClose: () => void
}

const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'CONNECTIONS', label: 'Connections only' },
  { value: 'ANONYMOUS', label: 'Anonymous' },
]

const MESSAGING_OPTIONS: { value: MessagingPermission; label: string }[] = [
  { value: 'EVERYONE', label: 'Everyone' },
  { value: 'CONNECTIONS_ONLY', label: 'Connections only' },
  { value: 'NOBODY', label: 'Nobody' },
]

const LOCATION_OPTIONS: { value: LocationVisibility; label: string }[] = [
  { value: 'HIDDEN', label: 'Hidden' },
  { value: 'APPROXIMATE', label: 'Approximate' },
  { value: 'CITY_ONLY', label: 'City only' },
  { value: 'STATE_ONLY', label: 'State only' },
  { value: 'COUNTRY_ONLY', label: 'Country only' },
]

function ChipRow<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 4 }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`chip-toggle${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsPanel({ onClose }: Props) {
  const { showToast } = useUiStore()
  const { data: settings, isLoading } = usePrivacySettings()
  const save = useSavePrivacySettings()
  const [form, setForm] = useState<PrivacySettings | null>(null)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  function set<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  function handleSave() {
    if (!form) return
    save.mutate(form, {
      onSuccess: () => showToast('Privacy settings saved', 'success'),
      onError: (e) => showToast((e as Error).message || 'Failed to save', 'error'),
    })
  }

  return (
    <div className="panel-comm" style={{ zIndex: 50 }}>
      <div className="panel-header">
        <button className="panel-back" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className="panel-title">Settings</span>
      </div>

      <div className="panel-content">
        {isLoading && (
          <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        )}

        {form && (
          <div style={{ padding: 'var(--space-4)' }}>
            <div className="section-title" style={{ padding: 0, marginBottom: 'var(--space-2)' }}>Privacy</div>

            <div className="input-group">
              <label>Who can see your profile</label>
              <ChipRow options={VISIBILITY_OPTIONS} value={form.profileVisibility} onChange={(v) => set('profileVisibility', v)} />
            </div>

            <div className="input-group">
              <label>Who can message you</label>
              <ChipRow options={MESSAGING_OPTIONS} value={form.messagingPermission} onChange={(v) => set('messagingPermission', v)} />
            </div>

            <div className="input-group">
              <label>Who can see your location</label>
              <ChipRow options={LOCATION_OPTIONS} value={form.locationVisibility} onChange={(v) => set('locationVisibility', v)} />
            </div>

            <div className="input-group">
              <label>Who can see your activity</label>
              <ChipRow options={VISIBILITY_OPTIONS} value={form.activityVisibility} onChange={(v) => set('activityVisibility', v)} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) 0', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={form.showInDiscovery}
                onChange={(e) => set('showInDiscovery', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--saffron-600)', cursor: 'pointer', flexShrink: 0 }}
              />
              Show me in Discover
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) 0', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={form.anonymousBrowsing}
                onChange={(e) => set('anonymousBrowsing', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--saffron-600)', cursor: 'pointer', flexShrink: 0 }}
              />
              Browse anonymously
            </label>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-5)' }}
              onClick={handleSave}
              disabled={save.isPending}
            >
              {save.isPending ? <span className="spinner spinner-sm" /> : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
