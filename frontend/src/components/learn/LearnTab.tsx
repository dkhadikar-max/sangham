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
  const [activeTab, setActiveTab] = useState<LearnSubTab>('courses')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      {/* Sticky header: search + tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Search bar — uses standard .search-bar class */}
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-2)' }}>
          <div className="search-bar">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
            <input
              type="text"
              placeholder="Search courses, texts, resources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tab strip — simple border-bottom, no card wrapper */}
        <div
          style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)', paddingLeft: 'var(--space-2)', touchAction: 'pan-x' }}
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

      {/* Tab content — rendered naturally; page scrolls */}
      {activeTab === 'courses'   && <CoursesView searchQuery={searchQuery} />}
      {activeTab === 'resources' && <PlaceholderTab label="Resources" />}
      {activeTab === 'circles'   && <PlaceholderTab label="Circles" />}
      {activeTab === 'sessions'  && <SessionsView />}
      {activeTab === 'library'   && <LibraryView searchQuery={searchQuery} />}
    </div>
  )
}
