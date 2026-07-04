import { create } from 'zustand'
import type { Tab, LearnSubTab as LearnTab, ToastItem, ToastType } from '@/types'

interface UiStore {
  activeTab: Tab
  activeLearnTab: LearnTab
  toasts: ToastItem[]
  theme: 'light' | 'dark'
  viewProfileId: string | null
  settingsOpen: boolean
  notificationsOpen: boolean
  contributeOpen: boolean
  pendingConversationId: string | null

  setTab: (tab: Tab) => void
  setLearnTab: (tab: LearnTab) => void
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  viewProfile: (userId: string) => void
  closeProfile: () => void
  openSettings: () => void
  closeSettings: () => void
  openNotifications: () => void
  closeNotifications: () => void
  openConversation: (conversationId: string) => void
  clearPendingConversation: () => void
  openContribute: () => void
  closeContribute: () => void
}

let toastSeq = 0

export const useUiStore = create<UiStore>((set) => ({
  activeTab: 'home',
  activeLearnTab: 'library',
  toasts: [],
  theme: 'light',
  viewProfileId: null,
  settingsOpen: false,
  notificationsOpen: false,
  contributeOpen: false,
  pendingConversationId: null,

  setTab(tab) {
    set({ activeTab: tab })
  },

  setLearnTab(tab) {
    set({ activeLearnTab: tab })
  },

  showToast(message, type = 'info') {
    const id = `toast-${++toastSeq}`
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  setTheme(theme) {
    set({ theme })
    document.documentElement.dataset.theme = theme
  },

  viewProfile(userId) {
    set({ viewProfileId: userId })
  },

  closeProfile() {
    set({ viewProfileId: null })
  },

  openSettings() {
    set({ settingsOpen: true })
  },

  closeSettings() {
    set({ settingsOpen: false })
  },

  openNotifications() {
    set({ notificationsOpen: true })
  },

  closeNotifications() {
    set({ notificationsOpen: false })
  },

  openConversation(conversationId) {
    set({ pendingConversationId: conversationId, activeTab: 'messages', viewProfileId: null })
  },

  clearPendingConversation() {
    set({ pendingConversationId: null })
  },

  openContribute() {
    set({ contributeOpen: true })
  },

  closeContribute() {
    set({ contributeOpen: false })
  },
}))
