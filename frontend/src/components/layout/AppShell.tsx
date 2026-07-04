'use client'

import { useUiStore } from '@/stores/ui'
import { BottomNav } from './BottomNav'
import { DesktopSidebar } from './DesktopSidebar'
import { AppHeader } from './AppHeader'
import { ToastStack } from '@/components/ui/Toast'
import { TextReader } from '@/components/library/TextReader'
import { usePublishPublicKey } from '@/hooks/useMessages'
import { ProfilePanel } from '@/components/discover/ProfilePanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import { ContributeView } from '@/components/contribute/ContributeView'
import type { ReactNode } from 'react'

interface TabPanelProps {
  id: string
  tab: string
  activeTab: string
  children: ReactNode
}

function TabPanel({ id, tab, activeTab, children }: TabPanelProps) {
  const isActive = tab === activeTab
  return (
    <div
      id={id}
      className={`tab-panel${isActive ? ' active' : ''}`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

interface AppShellProps {
  home: ReactNode
  learn: ReactNode
  communities: ReactNode
  discover: ReactNode
  messages: ReactNode
}

export function AppShell({ home, learn, communities, discover, messages }: AppShellProps) {
  const { activeTab, viewProfileId, closeProfile, settingsOpen, closeSettings, notificationsOpen, closeNotifications, contributeOpen, closeContribute } = useUiStore()
  usePublishPublicKey()

  return (
    <div className="app-shell">
      <DesktopSidebar />

      <div className="desktop-main-col">
        <AppHeader />

        <main className="app-main">
          <TabPanel id="tab-home" tab="home" activeTab={activeTab}>
            {home}
          </TabPanel>
          <TabPanel id="tab-learn" tab="learn" activeTab={activeTab}>
            {learn}
          </TabPanel>
          <TabPanel id="tab-communities" tab="communities" activeTab={activeTab}>
            {communities}
          </TabPanel>
          <TabPanel id="tab-discover" tab="discover" activeTab={activeTab}>
            {discover}
          </TabPanel>
          <TabPanel id="tab-messages" tab="messages" activeTab={activeTab}>
            {messages}
          </TabPanel>
        </main>

        <BottomNav />
        <ToastStack />
      </div>
      <TextReader />
      {viewProfileId && (
        <ProfilePanel userId={viewProfileId} onClose={closeProfile} />
      )}
      {settingsOpen && (
        <SettingsPanel onClose={closeSettings} />
      )}
      {notificationsOpen && (
        <NotificationsPanel onClose={closeNotifications} />
      )}
      {contributeOpen && (
        <ContributeView onClose={closeContribute} />
      )}
    </div>
  )
}
