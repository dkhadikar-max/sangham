'use client'

import { useState } from 'react'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { Avatar } from '@/components/ui/Avatar'
import type { Tab } from '@/types'

export function DesktopSidebar() {
  const { activeTab, setTab } = useUiStore()
  const { user } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  function nav(tab: Tab) {
    setTab(tab)
  }

  const isHome = activeTab === 'home'

  return (
    <aside className={`desktop-sidebar${isHome ? ' tab-home-active' : ''}${collapsed ? ' collapsed' : ''}`}>
      {/* Brand */}
      <div className="ds-brand">
        <div className="logo-mark logo-mark-sm">
          <i className="fa-solid fa-dharmachakra" />
        </div>
        <span
          className="ds-label"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}
        >
          Sangham
        </span>
        <button className="ds-toggle-btn" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle navigation">
          <svg viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="ds-nav">
        <div className="ds-nav-section-label">Navigate</div>

        {([
          { id: 'home',        icon: 'fa-house',           label: 'Home' },
          { id: 'discover',    icon: 'fa-magnifying-glass', label: 'Discover' },
          { id: 'communities', icon: 'fa-users',            label: 'Sanghas' },
          { id: 'learn',       icon: 'fa-book-open',        label: 'Library' },
          { id: 'messages',    icon: 'fa-message',          label: 'Messages' },
        ] as { id: Tab; icon: string; label: string }[]).map(({ id, icon, label }) => (
          <button
            key={id}
            className={`ds-nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => nav(id)}
            data-tooltip={label}
          >
            <i className={`fa-solid ${icon} ds-nav-icon`} />
            <span className="ds-label">{label}</span>
          </button>
        ))}

        <div className="ds-nav-divider" />
        <div className="ds-nav-section-label">Quick Actions</div>

        <button className="ds-nav-item" data-tooltip="Contribute">
          <i className="fa-solid fa-hand-holding-heart ds-nav-icon" />
          <span className="ds-label">Contribute</span>
        </button>
        <button className="ds-nav-item" data-tooltip="Settings">
          <i className="fa-solid fa-gear ds-nav-icon" />
          <span className="ds-label">Settings</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="ds-footer">
        {user && (
          <div className="ds-user">
            <Avatar src={user.profilePhoto} name={user.displayName} size="sm" />
            <span className="ds-user-name">{user.displayName}</span>
          </div>
        )}
        <button className="ds-create-btn">
          <i className="fa-solid fa-plus" style={{ fontSize: 12, flexShrink: 0 }} />
          <span className="ds-label">Share Reflection</span>
        </button>
      </div>
    </aside>
  )
}
