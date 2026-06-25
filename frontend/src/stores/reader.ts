import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LibraryText, TextSegment, Highlight, ReadingProgress } from '@/types'

export type ReaderTheme = 'light' | 'sepia' | 'dark'
export type ReaderFont = 'serif' | 'sans' | 'mono'
export type ReadingWidth = 'narrow' | 'comfortable' | 'wide'
export type LineSpacing = 'compact' | 'comfortable' | 'relaxed'

export interface ReaderPrefs {
  autoHideHeader: boolean
  showParagraphNumbers: boolean
  showCommunityHighlights: boolean
  syncProgress: boolean
  enableFocusModeGesture: boolean
}

const DEFAULT_PREFS: ReaderPrefs = {
  autoHideHeader: true,
  showParagraphNumbers: false,
  showCommunityHighlights: false,
  syncProgress: true,
  enableFocusModeGesture: true,
}

interface ReaderStore {
  currentText: LibraryText | null
  segments: TextSegment[]
  highlights: Highlight[]
  segOffset: number
  segTotal: number
  theme: ReaderTheme
  fontSize: number
  lineHeight: number
  fontFamily: ReaderFont
  readingWidth: ReadingWidth
  lineSpacing: LineSpacing
  isFocusMode: boolean
  prefs: ReaderPrefs
  progress: Record<string, ReadingProgress>

  setCurrentText: (text: LibraryText) => void
  setSegments: (segs: TextSegment[], total: number) => void
  appendSegments: (segs: TextSegment[]) => void
  setHighlights: (highlights: Highlight[]) => void
  addHighlight: (highlight: Highlight) => void
  setTheme: (theme: ReaderTheme) => void
  setFontSize: (size: number) => void
  stepFontSize: (delta: number) => void
  setLineHeight: (lh: number) => void
  setFontFamily: (f: ReaderFont) => void
  setReadingWidth: (w: ReadingWidth) => void
  setLineSpacing: (s: LineSpacing) => void
  setFocusMode: (on: boolean) => void
  setPref: (key: keyof ReaderPrefs, value: boolean) => void
  saveProgress: (textId: string, percent: number, title: string, tradition: string | null) => void
  getProgress: () => Record<string, ReadingProgress>
  close: () => void
}

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set, get) => ({
      currentText: null,
      segments: [],
      highlights: [],
      segOffset: 0,
      segTotal: 0,
      theme: 'light',
      fontSize: 17,
      lineHeight: 1.85,
      fontFamily: 'serif',
      readingWidth: 'comfortable',
      lineSpacing: 'comfortable',
      isFocusMode: false,
      prefs: DEFAULT_PREFS,
      progress: {},

      setCurrentText(text) {
        set({ currentText: text })
      },

      setSegments(segs, total) {
        set({ segments: segs, segTotal: total, segOffset: segs.length })
      },

      appendSegments(segs) {
        set((s) => ({
          segments: [...s.segments, ...segs],
          segOffset: s.segOffset + segs.length,
        }))
      },

      setHighlights(highlights) {
        set({ highlights })
      },

      addHighlight(highlight) {
        set((s) => ({ highlights: [highlight, ...s.highlights] }))
      },

      setTheme(theme) {
        set({ theme })
      },

      setFontSize(size) {
        set({ fontSize: Math.min(24, Math.max(13, size)) })
      },

      stepFontSize(delta) {
        set((s) => ({ fontSize: Math.min(24, Math.max(13, s.fontSize + delta)) }))
      },

      setLineHeight(lh) {
        set({ lineHeight: Math.min(2.2, Math.max(1.4, lh)) })
      },

      setFontFamily(f) {
        set({ fontFamily: f })
      },

      setReadingWidth(w) {
        set({ readingWidth: w })
      },

      setLineSpacing(s) {
        const lh = s === 'compact' ? 1.5 : s === 'relaxed' ? 2.2 : 1.85
        set({ lineSpacing: s, lineHeight: lh })
      },

      setFocusMode(on) {
        set({ isFocusMode: on })
      },

      setPref(key, value) {
        set((s) => ({ prefs: { ...s.prefs, [key]: value } }))
      },

      saveProgress(textId, percent, title, tradition) {
        const entry: ReadingProgress = {
          textId,
          percent,
          lastRead: Date.now(),
          title,
          tradition: tradition as ReadingProgress['tradition'],
        }
        set((s) => ({
          progress: { ...s.progress, [textId]: entry },
        }))
        // Record reading session for streak
        try {
          const today = new Date().toDateString()
          const raw = JSON.parse(localStorage.getItem('lib_reading_sessions') ?? '[]') as string[]
          if (!raw.includes(today)) {
            raw.push(today)
            if (raw.length > 90) raw.shift()
            localStorage.setItem('lib_reading_sessions', JSON.stringify(raw))
          }
        } catch {}
      },

      getProgress() {
        return get().progress
      },

      close() {
        set({ currentText: null, segments: [], highlights: [], segOffset: 0 })
      },
    }),
    {
      name: 'sangham-reader',
      partialize: (s) => ({
        theme: s.theme,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        fontFamily: s.fontFamily,
        readingWidth: s.readingWidth,
        lineSpacing: s.lineSpacing,
        prefs: s.prefs,
        progress: s.progress,
      }),
    },
  ),
)
