'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useReaderStore } from '@/stores/reader'
import { useAuthStore } from '@/stores/auth'
import {
  useLibraryText,
  useLibraryHighlights,
  useLibraryProgress,
  useLibraryMoreSegments,
  useBookmarkText,
  useAICompanion,
  useCreateHighlight,
} from '@/hooks/useLibrary'
import { libTradSym, libTradClass, libLangLabel, libGetCoverUrl, libShortTitle, libReadingMins, timeAgo } from '@/lib/library-utils'
import type { TextSegment } from '@/types'
import type { ReaderTheme, ReaderFont, ReadingWidth, LineSpacing } from '@/stores/reader'

type RightTab = 'ai' | 'notes' | 'community'

interface TOCEntry {
  label: string
  segIndex: number
  level: number
}

function buildTOC(segs: TextSegment[]): TOCEntry[] {
  const toc: TOCEntry[] = []
  const seen = new Set<string>()
  segs.forEach((s, i) => {
    if (s.chapterRef && !seen.has(s.chapterRef)) {
      seen.add(s.chapterRef)
      const m = s.chapterRef.match(/^(\d+)(\.(\d+))?(\.(\d+))?/)
      const level = m ? (m[5] ? 3 : m[3] ? 2 : 1) : 1
      toc.push({ label: s.chapterRef, segIndex: i, level })
    }
  })
  return toc
}

function SegmentList({ segs, highlights }: { segs: TextSegment[]; highlights: { segmentId: string; selectedText: string; color: string; note: string | null; id: string }[] }) {
  const hlBySegId: Record<string, typeof highlights> = {}
  highlights.forEach((h) => {
    if (!hlBySegId[h.segmentId]) hlBySegId[h.segmentId] = []
    hlBySegId[h.segmentId].push(h)
  })
  let lastChapter: string | null = null
  return (
    <>
      {segs.map((s, i) => {
        const showChapter = !!(s.chapterRef && s.chapterRef !== lastChapter)
        if (showChapter) lastChapter = s.chapterRef ?? null
        const hls = hlBySegId[s.id] ?? []
        const showKey = s.segmentKey && !/p\d+$/.test(s.segmentKey) && !showChapter
        return (
          <div key={s.id} className="reader-seg" id={`seg-${s.id}`} data-seg-id={s.id} data-seg-idx={i}>
            {showChapter && (
              <div className="reader-chapter-head">{s.chapterRef}</div>
            )}
            {showKey && (
              <div className="reader-seg-key">{s.segmentKey}</div>
            )}
            <p className="reader-seg-p">
              {hls.length === 0
                ? s.content
                : s.content}
            </p>
          </div>
        )
      })}
    </>
  )
}

function fontFamilyCSS(f: ReaderFont): string {
  if (f === 'sans') return "'Inter', sans-serif"
  if (f === 'mono') return "'Courier New', monospace"
  return "'Georgia', serif"
}

function readingWidthCSS(w: ReadingWidth): string {
  if (w === 'narrow') return '52ch'
  if (w === 'wide') return '84ch'
  return '68ch'
}

interface AICardProps {
  icon: string
  label: string
  desc: string
  onClick: () => void
  loading?: boolean
}
function AICard({ icon, label, desc, onClick, loading }: AICardProps) {
  return (
    <button type="button" className="reader-ai-card" onClick={onClick} disabled={loading}>
      <span className="reader-ai-card-icon">{icon}</span>
      <span className="reader-ai-card-label">{label}</span>
      <span className="reader-ai-card-desc">{desc}</span>
    </button>
  )
}

export function TextReader() {
  const {
    currentText,
    close,
    theme, setTheme,
    fontSize, stepFontSize,
    lineHeight,
    fontFamily, setFontFamily,
    readingWidth, setReadingWidth,
    lineSpacing, setLineSpacing,
    isFocusMode, setFocusMode,
    prefs, setPref,
    saveProgress,
    progress,
  } = useReaderStore()
  const { token } = useAuthStore()

  const textId = currentText?.id ?? null
  const { data: textDetail, isLoading } = useLibraryText(textId)
  const { data: highlights = [] } = useLibraryHighlights(textId)
  const { data: serverProgress } = useLibraryProgress(textId)
  const loadMore = useLibraryMoreSegments()
  const bookmarkMut = useBookmarkText()
  const aiMut = useAICompanion()

  const createHighlight = useCreateHighlight()

  const [extraSegs, setExtraSegs] = useState<TextSegment[]>([])
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab>('ai')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [focusModeLocal, setFocusModeLocal] = useState(false)
  const [pct, setPct] = useState(0)
  const [headerHidden, setHeaderHidden] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [aiResult, setAiResult] = useState<{ label: string; text: string } | null>(null)
  const [tocFilter, setTocFilter] = useState('')
  const [selMenu, setSelMenu] = useState<{ x: number; y: number; text: string; segmentId: string | null } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const allSegs = [...(textDetail?.segments ?? []), ...extraSegs]
  const segTotal = textDetail?.segmentsTotal ?? 0
  const hasMore = allSegs.length < segTotal
  const toc = buildTOC(allSegs)

  // Reset extra segs when text changes
  useEffect(() => {
    setExtraSegs([])
    setPct(0)
    setHeaderHidden(false)
    setFocusModeLocal(false)
    setAiResult(null)
    setTocFilter('')
  }, [textId])

  // Apply server progress percentage on load
  useEffect(() => {
    if (serverProgress?.percentComplete != null) {
      setPct(Number(serverProgress.percentComplete))
    } else if (textId && progress[textId]) {
      setPct(progress[textId].percent)
    }
  }, [serverProgress, textId, progress])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !segTotal) return
    const ratio = el.scrollTop / Math.max(el.scrollHeight - el.clientHeight, 1)
    const loadedPct = allSegs.length / segTotal
    const newPct = Math.max(0, Math.min(99, Math.round(loadedPct * 100 * Math.max(ratio, 0.01))))
    setPct(newPct)
    if (prefs.autoHideHeader) {
      setHeaderHidden(el.scrollTop > 80)
    }
  }, [allSegs.length, segTotal, prefs.autoHideHeader])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll])

  // Debounced save progress
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!textId || !textDetail) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveProgress(textId, pct, textDetail.title, textDetail.collection?.tradition ?? null)
    }, 1000)
  }, [pct, textId, textDetail, saveProgress])

  const handleLoadMore = async () => {
    if (!textId) return
    const newSegs = await loadMore.mutateAsync({ textId, offset: allSegs.length })
    setExtraSegs((prev) => [...prev, ...(Array.isArray(newSegs) ? newSegs : [])])
  }

  const handleBookmark = async () => {
    if (!textId || !token) return
    const next = !isBookmarked
    setIsBookmarked(next)
    await bookmarkMut.mutateAsync({ textId, bookmark: next })
  }

  const handleAI = async (action: string) => {
    if (!textId) return
    const labels: Record<string, string> = {
      explain: 'Explanation',
      summarize: 'Summary',
      example: 'Modern Example',
      context: 'Historical Context',
    }
    setAiResult({ label: labels[action] ?? action, text: '' })
    try {
      const res = await aiMut.mutateAsync({ textId, action })
      setAiResult({ label: labels[action] ?? action, text: res.result ?? '' })
    } catch {
      setAiResult({ label: labels[action] ?? action, text: 'Could not generate response. Please try again.' })
    }
  }

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setSelMenu(null); return }
    const text = sel.toString().trim()
    if (text.length < 3) { setSelMenu(null); return }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    let node: Node | null = sel.anchorNode
    let segmentId: string | null = null
    while (node) {
      if (node instanceof Element) {
        const id = node.getAttribute('data-seg-id')
        if (id) { segmentId = id; break }
      }
      node = node.parentElement
    }
    setSelMenu({ x: rect.left + rect.width / 2, y: rect.top, text, segmentId })
  }, [])

  const handleHighlight = async (color: string) => {
    if (!selMenu || !textId || !selMenu.segmentId) return
    try {
      await createHighlight.mutateAsync({ textId, segmentId: selMenu.segmentId, selectedText: selMenu.text, color })
    } catch { /* best-effort */ }
    setSelMenu(null)
    window.getSelection()?.removeAllRanges()
  }

  const jumpToTOC = (entry: TOCEntry) => {
    const segId = allSegs[entry.segIndex]?.id
    if (!segId) return
    const el = document.getElementById(`seg-${segId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setLeftOpen(false)
  }

  const cycleTheme = () => {
    const order: ReaderTheme[] = ['light', 'sepia', 'dark']
    const next = order[(order.indexOf(theme) + 1) % 3]
    setTheme(next)
  }

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'sepia' ? '☕' : '☀'

  const filteredTOC = toc.filter((e) =>
    !tocFilter || e.label.toLowerCase().includes(tocFilter.toLowerCase()),
  )

  const readingMins = segTotal ? libReadingMins(segTotal) : ''
  const coverUrl = currentText ? libGetCoverUrl(currentText) : null
  const tc = libTradClass(currentText?.collection?.tradition)
  const sym = libTradSym(currentText?.collection?.tradition)

  if (!currentText) return null

  const panelStyle: React.CSSProperties = {
    '--reader-fs': `${fontSize}px`,
    '--reader-lh': lineHeight,
    '--reader-font': fontFamilyCSS(fontFamily),
    '--reader-width': readingWidthCSS(readingWidth),
  } as React.CSSProperties

  return (
    <div
      className={`reader-panel${isFocusMode || focusModeLocal ? ' focus-mode' : ''}`}
      data-reader-theme={theme}
      style={panelStyle}
    >
      {/* Header */}
      <div className={`reader-header${headerHidden ? ' hidden' : ''}`} id="reader-header">
        <button className="reader-back-btn" onClick={close} aria-label="Go back">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="reader-header-title">
          <div className="reader-header-main">
            {currentText.title.length > 40 ? currentText.title.slice(0, 40) + '…' : currentText.title}
          </div>
        </div>
        <div className="reader-header-actions">
          <button
            className={`reader-icon-btn${leftOpen ? ' active' : ''}`}
            onClick={() => setLeftOpen((o) => !o)}
            title="Contents"
            aria-label="Table of contents"
          >
            <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="15" y2="18" /></svg>
          </button>
          <button
            className={`reader-icon-btn${isBookmarked ? ' active' : ''}`}
            onClick={handleBookmark}
            title="Bookmark"
            aria-label="Bookmark"
          >
            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
          </button>
          <button
            className="reader-icon-btn"
            onClick={() => setSettingsOpen((o) => !o)}
            title="Reading settings"
            aria-label="Reading settings"
          >
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
          <button
            className={`reader-rp-toggle-btn${rightOpen ? ' active' : ''}`}
            onClick={() => setRightOpen((o) => !o)}
            title="AI · Notes · Community"
            aria-label="Toggle AI panel"
          >
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="reader-body-wrap">
        {/* Left TOC panel */}
        <aside className={`reader-left-panel${leftOpen ? ' mobile-open' : ''}`} id="reader-left-panel">
          <div className="reader-lp-head">
            <span className="reader-lp-title">Contents</span>
            <button className="reader-lp-close" onClick={() => setLeftOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="reader-toc-search">
            <input
              type="search"
              placeholder="Filter sections…"
              value={tocFilter}
              onChange={(e) => setTocFilter(e.target.value)}
              aria-label="Filter sections"
            />
          </div>
          <div className="reader-toc-list" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {filteredTOC.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: 'var(--rt-muted)' }}>
                {toc.length === 0 ? 'No chapters detected' : 'No matches'}
              </div>
            )}
            {filteredTOC.map((entry, i) => (
              <button
                key={i}
                type="button"
                className="reader-toc-item"
                data-level={entry.level}
                style={entry.level === 2 ? { paddingLeft: 28, fontSize: 12 } : entry.level === 3 ? { paddingLeft: 40, fontSize: 11 } : undefined}
                onClick={() => jumpToTOC(entry)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {/* Reading stats */}
          <div className="reader-lp-stats">
            <div className="reader-lp-stat-row">
              <span>Passages</span>
              <span className="reader-lp-stat-val">{segTotal.toLocaleString()}</span>
            </div>
            <div className="reader-lp-stat-row">
              <span>Progress</span>
              <span className="reader-lp-stat-val">{pct}%</span>
            </div>
            {readingMins && (
              <div className="reader-lp-stat-row">
                <span>Est. read</span>
                <span className="reader-lp-stat-val">{readingMins}</span>
              </div>
            )}
          </div>
        </aside>
        {leftOpen && (
          <div className="reader-left-bd" id="reader-left-bd" onClick={() => setLeftOpen(false)} />
        )}

        {/* Main scroll */}
        <div className="reader-scroll" ref={scrollRef} id="reader-scroll">
          {/* Book info */}
          <div className="reader-book-info">
            {coverUrl ? (
              <img className="reader-cover-img" src={coverUrl} alt={currentText.title} loading="lazy" />
            ) : (
              <div className={`reader-band ${tc}`}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{sym}</div>
                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, padding: '0 14px', textAlign: 'center', opacity: .95, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                  {currentText.title}
                </div>
                {currentText.author && (
                  <div style={{ fontSize: 9, opacity: .65, marginTop: 6, padding: '0 12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                    {currentText.author}
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : textDetail && (
              <>
                <div className="reader-book-title">{textDetail.title}</div>
                <div className="reader-book-byline">
                  {textDetail.author && <strong>{textDetail.author}</strong>}
                  {textDetail.translator && ` · Trans. ${textDetail.translator}`}
                  {textDetail.collection?.name && <> · <em>{textDetail.collection.name}</em></>}
                </div>
                <div className="reader-book-stats">
                  <span className="reader-book-stat"><strong>{segTotal.toLocaleString()}</strong> passages</span>
                  <span className="reader-book-stat"><strong>{libLangLabel(textDetail.language)}</strong></span>
                  {readingMins && <span className="reader-book-stat"><strong>{readingMins}</strong> est. read</span>}
                  {pct > 0 && <span className="reader-book-stat"><strong>{pct}%</strong> complete</span>}
                </div>
                <div className="reader-book-actions">
                  <button
                    className={`reader-action-btn${isBookmarked ? ' bookmarked' : ''}`}
                    onClick={handleBookmark}
                  >
                    <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    {isBookmarked ? 'Saved' : 'Bookmark'}
                  </button>
                  <button className="reader-action-btn">
                    <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    Share
                  </button>
                  {textDetail.collection?.sourceUrl && (
                    <a
                      href={textDetail.collection.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reader-action-btn"
                    >
                      <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      Source
                    </a>
                  )}
                </div>
                <div className="reader-book-divider" />
              </>
            )}
          </div>

          {/* Content */}
          {textDetail && (
            <div className="reader-content-area" id="reader-content-area" onMouseUp={handleMouseUp}>
              <SegmentList segs={allSegs} highlights={highlights} />
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <button
              className="reader-load-more"
              onClick={handleLoadMore}
              disabled={loadMore.isPending}
            >
              {loadMore.isPending
                ? 'Loading…'
                : `Load more · ${allSegs.length} of ${segTotal.toLocaleString()} passages`}
            </button>
          )}

          {textDetail?.attribution && (
            <div className="reader-attribution">{textDetail.attribution}</div>
          )}
        </div>

        {/* Right panel */}
        <aside className={`reader-right-panel${rightOpen ? ' mobile-open' : ''}`} id="reader-right-panel">
          <div className="reader-rp-head">
            <div className="reader-rp-tabs">
              {(['ai', 'notes', 'community'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`reader-rp-tab${rightTab === tab ? ' active' : ''}`}
                  onClick={() => setRightTab(tab)}
                >
                  {tab === 'ai' ? '✨ AI' : tab === 'notes' ? 'Notes' : 'Community'}
                </button>
              ))}
            </div>
            <button className="reader-lp-close" onClick={() => setRightOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="reader-rp-body">
            {rightTab === 'ai' && (
              <div>
                <div className="reader-ai-grid">
                  <AICard icon="💡" label="Explain" desc="Clarify this passage" onClick={() => handleAI('explain')} loading={aiMut.isPending} />
                  <AICard icon="📝" label="Summarize" desc="Key points" onClick={() => handleAI('summarize')} loading={aiMut.isPending} />
                  <AICard icon="🌍" label="Example" desc="Modern application" onClick={() => handleAI('example')} loading={aiMut.isPending} />
                  <AICard icon="📚" label="Context" desc="Historical background" onClick={() => handleAI('context')} loading={aiMut.isPending} />
                </div>
                {aiMut.isPending && (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <div className="spinner" />
                  </div>
                )}
                {aiResult && (
                  <div className="reader-ai-result">
                    <div className="reader-ai-result-label">{aiResult.label}</div>
                    <div>{aiResult.text || <span style={{ color: 'var(--rt-muted)' }}>Generating…</span>}</div>
                  </div>
                )}
                {!token && (
                  <div style={{ fontSize: 12, color: 'var(--rt-muted)', textAlign: 'center', marginTop: 8 }}>
                    Sign in to use AI companion
                  </div>
                )}
              </div>
            )}
            {rightTab === 'notes' && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--rt-muted)', textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📝</div>
                  <div>Select text while reading to add notes and highlights.</div>
                </div>
              </div>
            )}
            {rightTab === 'community' && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--rt-muted)', textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🏘️</div>
                  <div>Study circles discussing this text will appear here.</div>
                </div>
              </div>
            )}
          </div>
        </aside>
        {rightOpen && (
          <div className="reader-right-bd" onClick={() => setRightOpen(false)} />
        )}
      </div>

      {/* Progress footer */}
      <div className={`reader-footer${(isFocusMode || focusModeLocal) ? ' hidden' : ''}`} id="reader-footer">
        <div className="reader-progress-track" title="Click to jump">
          <div className="reader-progress-fill" id="reader-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="reader-footer-info">
          <span>{pct > 0 ? `${pct}% read` : 'Not started'}</span>
          <span>
            {segTotal > 0
              ? (() => {
                  const remaining = Math.max(0, segTotal - Math.round(segTotal * pct / 100))
                  const mins = Math.ceil(remaining * 30 / 200)
                  return mins > 0 ? `~${mins < 60 ? mins + 'min' : Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm'} left` : '✓ Complete'
                })()
              : ''}
          </span>
        </div>
      </div>

      {/* Focus mode progress strip */}
      <div className="reader-focus-progress">
        <div className="reader-focus-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Mobile controls bar */}
      <div className={`reader-controls-bar${(isFocusMode || focusModeLocal) ? ' hidden' : ''}`} id="reader-controls-bar">
        <button className="rctrl-btn" onClick={() => jumpToTOC(toc[Math.max(0, toc.findIndex((_, i, a) => i === a.length - 1) - 1)])} title="Previous section" aria-label="Previous section">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button className="rctrl-btn" onClick={() => setLeftOpen((o) => !o)} aria-label="Contents">
          <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="15" y2="18" /></svg>
        </button>
        <button className="rctrl-btn" onClick={() => stepFontSize(-2)} aria-label="Smaller font">A−</button>
        <button className="rctrl-btn" onClick={cycleTheme} aria-label="Theme">{themeIcon}</button>
        <button className="rctrl-btn" onClick={() => stepFontSize(2)} aria-label="Larger font">A+</button>
        <button className="rctrl-btn" onClick={() => setFocusModeLocal((o) => !o)} aria-label="Focus mode">⛶</button>
      </div>

      {/* Selection highlight toolbar */}
      {selMenu && (
        <div
          style={{
            position: 'fixed',
            left: selMenu.x,
            top: selMenu.y - 44,
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 300,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 11, color: '#aaa', marginRight: 2 }}>Highlight</span>
          {(['#FEF08A', '#BBF7D0', '#BAE6FD', '#FCA5A5'] as const).map((color) => (
            <button
              key={color}
              onClick={() => handleHighlight(color)}
              style={{ width: 18, height: 18, borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}
            />
          ))}
          <button
            onClick={() => { setSelMenu(null); window.getSelection()?.removeAllRanges() }}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
          >✕</button>
        </div>
      )}

      {/* Desktop floating controls */}
      <div className="reader-float-controls" id="reader-float-controls">
        <button className="rfloat-btn" onClick={() => stepFontSize(-2)} title="Decrease font (−)">A−</button>
        <button className="rfloat-btn" onClick={() => stepFontSize(2)} title="Increase font (+)">A+</button>
        <button className="rfloat-btn" onClick={cycleTheme} title="Cycle theme">{themeIcon}</button>
        <button className="rfloat-btn" onClick={() => setLeftOpen((o) => !o)} title="Contents">
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="15" y2="18" />
          </svg>
        </button>
        <button className="rfloat-btn" onClick={() => setFocusModeLocal((o) => !o)} title="Focus mode">⛶</button>
      </div>

      {/* Settings drawer */}
      <div
        className={`reader-settings-overlay${settingsOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
      >
        <div className="reader-settings-drawer">
          <div className="reader-settings-head">
            <span>Reading Settings</span>
            <button onClick={() => setSettingsOpen(false)} aria-label="Close settings">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="reader-settings-body">
            {/* Font Size */}
            <div className="rsetting-group">
              <div className="rsetting-label">Font Size</div>
              <div className="rsetting-row">
                <button onClick={() => stepFontSize(-1)} aria-label="Decrease">A−</button>
                <span className="rsetting-font-display">{fontSize}px</span>
                <button onClick={() => stepFontSize(1)} aria-label="Increase">A+</button>
              </div>
            </div>
            {/* Theme */}
            <div className="rsetting-group">
              <div className="rsetting-label">Theme</div>
              <div className="rsetting-themes">
                {(['light', 'sepia', 'dark'] as ReaderTheme[]).map((t) => (
                  <button key={t} className={`rtheme-btn${theme === t ? ' active' : ''}`} onClick={() => setTheme(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Reading Width */}
            <div className="rsetting-group">
              <div className="rsetting-label">Reading Width</div>
              <div className="rsetting-widths">
                {(['narrow', 'comfortable', 'wide'] as ReadingWidth[]).map((w) => (
                  <button key={w} className={`rwidth-btn${readingWidth === w ? ' active' : ''}`} onClick={() => setReadingWidth(w)}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Line Spacing */}
            <div className="rsetting-group">
              <div className="rsetting-label">Line Spacing</div>
              <div className="rsetting-spacing">
                {(['compact', 'comfortable', 'relaxed'] as LineSpacing[]).map((s) => (
                  <button key={s} className={`rspacing-btn${lineSpacing === s ? ' active' : ''}`} onClick={() => setLineSpacing(s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Font Family */}
            <div className="rsetting-group">
              <div className="rsetting-label">Font Family</div>
              <div className="rsetting-fonts">
                {([['serif', 'Serif'], ['sans', 'Sans'], ['mono', 'Mono']] as [ReaderFont, string][]).map(([f, label]) => (
                  <button
                    key={f}
                    className={`rfont-btn${fontFamily === f ? ' active' : ''}`}
                    style={{ fontFamily: fontFamilyCSS(f) }}
                    onClick={() => setFontFamily(f)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rsetting-divider" />
            <div className="rsetting-label">Reading Preferences</div>
            <label className="rpref-row">
              <input type="checkbox" checked={prefs.autoHideHeader} onChange={(e) => setPref('autoHideHeader', e.target.checked)} />
              Auto-hide header on scroll
            </label>
            <label className="rpref-row">
              <input type="checkbox" checked={prefs.showParagraphNumbers} onChange={(e) => setPref('showParagraphNumbers', e.target.checked)} />
              Show paragraph numbers
            </label>
            <label className="rpref-row">
              <input type="checkbox" checked={prefs.syncProgress} onChange={(e) => setPref('syncProgress', e.target.checked)} />
              Sync progress across devices
            </label>
            <button
              className="rsetting-reset"
              onClick={() => {
                setTheme('light')
                setFontFamily('serif')
                setReadingWidth('comfortable')
                setLineSpacing('comfortable')
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
