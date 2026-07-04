'use client'

import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { Avatar } from '@/components/ui/Avatar'
import type { Tab } from '@/types'

export function AppHeader() {
  const { activeTab, setTab, showToast, viewProfile } = useUiStore()
  const { user } = useAuthStore()

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'home',        icon: 'fa-house',          label: 'Home' },
    { id: 'communities', icon: 'fa-users',           label: 'Communities' },
    { id: 'learn',       icon: 'fa-book-open',       label: 'Learn' },
    { id: 'discover',    icon: 'fa-compass',          label: 'Discover' },
    { id: 'messages',    icon: 'fa-comment-dots',    label: 'Messages' },
  ]

  return (
    <header className="app-header">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div className="logo-mark">
          <i className="fa-solid fa-dharmachakra" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
          Sangham
        </span>
      </div>

      {/* Center nav (lg+) */}
      <div className="hidden lg:flex items-center gap-8">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`header-nav-link flex items-center gap-2 font-medium text-sm transition-colors${activeTab === id ? ' active text-sangham-gold' : ' text-sangham-brown-light hover:text-sangham-ink'}`}
            onClick={() => setTab(id)}
          >
            <i className={`fa-solid ${icon}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <button
          className="w-10 h-10 rounded-full bg-sangham-cream-dark hover:bg-sangham-gold/10 flex items-center justify-center transition-colors text-sangham-brown"
          aria-label="Search"
          onClick={() => showToast('Search — coming soon', 'info')}
        >
          <i className="fa-solid fa-magnifying-glass text-sm" />
        </button>
        <button
          className="w-10 h-10 rounded-full bg-sangham-cream-dark hover:bg-sangham-gold/10 flex items-center justify-center transition-colors text-sangham-brown relative"
          aria-label="Notifications"
          onClick={() => showToast('Notifications — coming soon', 'info')}
        >
          <i className="fa-regular fa-bell text-sm" />
        </button>
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-br from-sangham-gold to-sangham-gold-dark text-white flex items-center justify-center shadow-md shadow-sangham-gold/20 hover:shadow-lg transition-shadow"
          aria-label="Share reflection"
          onClick={() => showToast('Share Reflection — coming soon', 'info')}
        >
          <i className="fa-solid fa-plus text-sm" />
        </button>
        {user && (
          <button
            onClick={() => viewProfile(user.id)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', borderRadius: '50%' }}
            aria-label="My profile"
          >
            <Avatar src={user.profilePhoto} name={user.displayName} size="sm" />
          </button>
        )}
      </div>
    </header>
  )
}
