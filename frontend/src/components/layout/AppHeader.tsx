'use client'

import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { Avatar } from '@/components/ui/Avatar'
import { useNotifications } from '@/hooks/useNotifications'

export function AppHeader() {
  const { showToast, viewProfile, openNotifications } = useUiStore()
  const { user } = useAuthStore()
  const { data: notifData } = useNotifications()

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
          onClick={openNotifications}
        >
          <i className="fa-regular fa-bell text-sm" />
          {!!notifData?.unreadCount && (
            <span className="header-notif-badge">{notifData.unreadCount > 9 ? '9+' : notifData.unreadCount}</span>
          )}
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
