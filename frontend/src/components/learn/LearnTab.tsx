'use client'

import { useState } from 'react'
import { LibraryView } from '@/components/library/LibraryView'
import { SessionsView } from '@/components/learn/SessionsView'
import { CoursesView } from '@/components/learn/CoursesView'
import type { LearnSubTab } from '@/types'

const TABS: { id: LearnSubTab; label: string }[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'resources', label: 'Resources' },
  { id: 'circles', label: 'Circles' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'library', label: 'Library' },
]

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🚧</div>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Coming in a future phase</div>
    </div>
  )
}

export function LearnTab() {
  const [activeTab, setActiveTab] = useState<LearnSubTab>('library')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      {/* Sticky header: search + tabs */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--surface-bg)',
          paddingBottom: 'var(--space-2)',
          paddingTop: 'var(--space-1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {/* Search bar */}
        <div style={{ position: 'relative', margin: '0 var(--space-4)' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)', fontSize: 14 }}
          />
          <input
            type="text"
            placeholder="Search courses, texts, resources…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              padding: '14px 16px 14px 44px',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(199,154,59,0.1)',
              outline: 'none',
              boxShadow: 'var(--shadow-1)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tab nav */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-2xl)',
            padding: '0 var(--space-5)',
            boxShadow: 'var(--shadow-1)',
            border: '1px solid rgba(199,154,59,0.1)',
            margin: '0 var(--space-4)',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: '1.5rem', touchAction: 'pan-x' }}
            className="scrollbar-hide"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`comm-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content — rendered naturally; page scrolls */}
      {activeTab === 'courses'   && <CoursesView searchQuery={searchQuery} />}
      {activeTab === 'resources' && <PlaceholderTab label="Resources" />}
      {activeTab === 'circles'   && <PlaceholderTab label="Circles" />}
      {activeTab === 'sessions'  && <SessionsView />}
      {activeTab === 'library'   && <LibraryView searchQuery={searchQuery} />}
    </div>
  )
}
