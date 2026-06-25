import { create } from 'zustand'
import type { Tab, LearnSubTab as LearnTab, ToastItem, ToastType } from '@/types'

interface UiStore {
  activeTab: Tab
  activeLearnTab: LearnTab
  toasts: ToastItem[]
  theme: 'light' | 'dark'

  setTab: (tab: Tab) => void
  setLearnTab: (tab: LearnTab) => void
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
}

let toastSeq = 0

export const useUiStore = create<UiStore>((set) => ({
  activeTab: 'home',
  activeLearnTab: 'library',
  toasts: [],
  theme: 'light',

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
}))
