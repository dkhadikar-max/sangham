'use client'

import { useState, useRef, useCallback } from 'react'
import { useReaderStore } from '@/stores/reader'
import { useUiStore } from '@/stores/ui'
import { useLibraryCollections, useLibrarySearch } from '@/hooks/useLibrary'
import {
  libTradSym,
  libTradClass,
  libTradLabel,
  libTradBadgeClass,
  libLangLabel,
  libGetCoverUrl,
  libShortTitle,
  timeAgo,
} from '@/lib/library-utils'
import type { LibraryText, LibraryCollection } from '@/types'

interface Props {
  onOpenCollection: (id: string) => void
  onOpenBookmarks: () => void
}

function ContinueMiniCover({ tx, tc, sym }: { tx: { coverUrl?: string | null; title: string }; tc: string; sym: string }) {
  const url = libGetCoverUrl(tx)
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        style={{ width: 52, height: 70, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
      />
    )
  }
  return (
    <div
      className={`lib-continue-mini-cover ${tc}`}
      style={{ width: 52, height: 70, flexDirection: 'column', padding: 6, fontSize: '1rem' }}
    >
      <div className="lib-cover-sym-wrap" style={{ fontSize: '1.2rem' }}>{sym}</div>
      <div className="lib-cover-title-line" style={{ fontSize: 6 }}>{libShortTitle(tx.title, 30)}</div>
    </div>
  )
}

function BookCover({ tx }: { tx: LibraryText }) {
  const url = libGetCoverUrl(tx)
  const tc = libTradClass(tx.collection?.tradition)
  const sym = libTradSym(tx.collection?.tradition)
  if (url) {
    return <img className="lib-book-cover-img" src={url} alt="" loading="lazy" />
  }
  const fb = (
    <>
      <div className="lib-cover-sym-wrap" style={{ fontSize: '2rem' }}>{sym}</div>
      <div className="lib-cover-title-line" style={{ fontSize: 7 }}>{libShortTitle(tx.title, 30)}</div>
      <div className="lib-cover-brand-line">Sangham</div>
    </>
  )
  return <div className={`lib-book-cover-fb ${tc}`}>{fb}</div>
}

function useDebounce(fn: (v: string) => void, delay: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((v: string) => {
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(() => fn(v), delay)
  }, [fn, delay])
}

function GridCover({ tx }: { tx: LibraryText }) {
  const url = libGetCoverUrl(tx)
  const tc = libTradClass(tx.collection?.tradition)
  const sym = libTradSym(tx.collection?.tradition)
  if (url) {
    return <img className="lib-grid-cover-img" src={url} alt="" loading="lazy" />
  }
  return (
    <div className={`lib-grid-cover-fb ${tc}`}>
      <div className="lib-cover-sym-wrap">{sym}</div>
      <div className="lib-cover-title-line">{libShortTitle(tx.title, 30)}</div>
      <div className="lib-cover-brand-line">Sangham</div>
    </div>
  )
}

export function LibraryHome({ onOpenCollection, onOpenBookmarks }: Props) {
  const { setCurrentText, progress } = useReaderStore()
  const { showToast } = useUiStore()
  const { data: collections = [], isLoading: colLoading } = useLibraryCollections()
  const { data: allTexts = [], isLoading: textsLoading } = useLibrarySearch({ limit: 24 })
  const { data: recentTexts = [] } = useLibrarySearch({ limit: 8, sort: 'recent' })

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const debounce = useDebounce(setDebouncedQ, 400)
  function handleSearchChange(v: string) {
    setQ(v)
    debounce(v)
  }
  const { data: searchResults = [], isLoading: searchLoading } = useLibrarySearch({ q: debouncedQ || undefined, limit: 30 })
  const isSearching = debouncedQ.trim().length > 0

  const inProgress = Object.entries(progress)
    .filter(([, p]) => p.percent > 0 && p.percent < 100)
    .sort(([, a], [, b]) => b.lastRead - a.lastRead)
    .slice(0, 3)

  const isLoading = colLoading || textsLoading

  return (
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      {/* Search */}
      <div style={{ padding: 'var(--space-3) var(--space-4) 0' }}>
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            type="search"
            placeholder="Search texts by title, author, or translator..."
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {isSearching ? (
        <div className="lib-section">
          <div className="lib-section-header">
            <span className="lib-section-title">Search Results</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{searchResults.length} found</span>
          </div>
          {searchLoading && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}><div className="spinner spinner-lg" /></div>
          )}
          {!searchLoading && searchResults.length === 0 && (
            <p style={{ padding: '0 var(--space-4)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              No texts match &ldquo;{debouncedQ}&rdquo;.
            </p>
          )}
          {!searchLoading && searchResults.length > 0 && (
            <div className="lib-kindle-grid">
              {searchResults.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  className="lib-grid-card"
                  onClick={() => setCurrentText(tx)}
                >
                  <GridCover tx={tx} />
                  <h4>{libShortTitle(tx.title, 35)}</h4>
                  {(tx.translator ?? tx.author) && (
                    <div className="lib-card-author">{tx.translator ?? tx.author}</div>
                  )}
                  <span className={`lib-card-badge ${libTradBadgeClass(tx.collection?.tradition)}`}>
                    {libTradLabel(tx.collection?.tradition)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Continue Reading */}
      {inProgress.length > 0 && (
        <div className="lib-section">
          <div className="lib-section-header">
            <span className="lib-section-title">Continue Reading</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {inProgress.map(([id, p]) => {
              const textObj = allTexts.find((t) => t.id === id) ?? { title: p.title, coverUrl: null, collection: { id: '', name: '', tradition: p.tradition as never } }
              const tc = libTradClass(p.tradition)
              const sym = libTradSym(p.tradition)
              const lastStr = p.lastRead ? timeAgo(new Date(p.lastRead).toISOString()) : ''
              return (
                <button
                  key={id}
                  type="button"
                  className="lib-continue-card"
                  onClick={() => setCurrentText(textObj as LibraryText)}
                >
                  <ContinueMiniCover tx={{ coverUrl: libGetCoverUrl(textObj as LibraryText), title: p.title }} tc={tc} sym={sym} />
                  <div className="lib-continue-info">
                    <div className="lib-continue-title">{libShortTitle(p.title)}</div>
                    <div className="lib-continue-sub">{lastStr ? `${lastStr} · ` : ''}{p.percent}% complete</div>
                    <div className="lib-continue-progress">
                      <div className="lib-continue-bar" style={{ width: `${p.percent}%` }} />
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'var(--saffron-500)', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {recentTexts.length > 0 && (
        <div className="lib-section">
          <div className="lib-section-header">
            <span className="lib-section-title">Recently Added</span>
          </div>
          <div className="lib-book-scroll">
            {recentTexts.map((tx) => (
              <button
                key={tx.id}
                type="button"
                className="lib-book-card"
                onClick={() => setCurrentText(tx)}
              >
                <BookCover tx={tx} />
                <h4>{libShortTitle(tx.title, 35)}</h4>
                <p>{tx.translator ?? tx.author ?? ''}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended (same tradition as top in-progress) */}
      {inProgress.length > 0 && (() => {
        const primaryTrad = inProgress[0][1].tradition
        const readIds = new Set(inProgress.map(([id]) => id))
        const recs = allTexts.filter(
          (t) => t.collection?.tradition === primaryTrad && !readIds.has(t.id),
        ).slice(0, 8)
        if (recs.length < 2) return null
        return (
          <div className="lib-section">
            <div className="lib-section-header">
              <span className="lib-section-title">More {libTradLabel(primaryTrad)} Texts</span>
            </div>
            <div className="lib-book-scroll">
              {recs.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  className="lib-book-card"
                  onClick={() => setCurrentText(tx)}
                >
                  <BookCover tx={tx} />
                  <h4>{libShortTitle(tx.title, 35)}</h4>
                  <p>{tx.translator ?? tx.author ?? ''}</p>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Collections */}
      {isLoading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <>
          <div className="lib-section">
            <div className="lib-section-header">
              <span className="lib-section-title">Collections</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{collections.length} collections</span>
            </div>
            <div className="lib-coll-grid">
              {collections.map((c: LibraryCollection) => {
                const tc = libTradClass(c.tradition)
                const sym = libTradSym(c.tradition)
                const tradLabel = libTradLabel(c.tradition)
                const langs = (c.languages ?? []).map((l) => (
                  <span
                    key={l}
                    style={{ background: 'rgba(255,255,255,.18)', borderRadius: 99, padding: '1px 6px', fontSize: 9, fontWeight: 600, color: 'white' }}
                  >
                    {libLangLabel(l)}
                  </span>
                ))
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="lib-coll-card"
                    onClick={() => onOpenCollection(c.id)}
                  >
                    <div className={`lib-coll-cover ${tc}`}>
                      <div className="lib-coll-sym">{sym}</div>
                      <div className="lib-coll-trad">{tradLabel}</div>
                    </div>
                    <div className="lib-coll-foot">
                      <div className="lib-coll-name">{c.name}</div>
                      <div className="lib-coll-count">
                        {c._count?.texts ?? 0} texts
                        {langs.length > 0 && <> · {langs}</>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Browse All Texts */}
          <div className="lib-section">
            <div className="lib-section-header">
              <span className="lib-section-title">Browse All Texts</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{allTexts.length} texts</span>
            </div>
            <div className="lib-kindle-grid">
              {allTexts.map((tx, i) => {
                const tradKey = (tx.collection?.tradition ?? 'other').toLowerCase()
                const badgeClass = libTradBadgeClass(tx.collection?.tradition)
                const pct = progress[tx.id]?.percent ?? 0
                return (
                  <button
                    key={tx.id}
                    type="button"
                    className="lib-grid-card"
                    style={{ animationDelay: `${i * 0.02}s` }}
                    onClick={() => setCurrentText(tx)}
                  >
                    <GridCover tx={tx} />
                    <h4>{libShortTitle(tx.title, 35)}</h4>
                    {(tx.translator ?? tx.author) && (
                      <div className="lib-card-author">{tx.translator ?? tx.author}</div>
                    )}
                    <span className={`lib-card-badge ${badgeClass}`}>
                      {libTradLabel(tx.collection?.tradition)}
                    </span>
                    {pct > 0 && (
                      <div className="lib-text-card-prog" style={{ marginTop: 4 }}>
                        <div className="lib-text-card-progfill" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Write & Publish */}
          <div className="lib-section">
            <button type="button" className="lib-write-btn" onClick={() => showToast('Write & Publish — coming soon', 'info')}>
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Write &amp; Publish Your Article or Book
            </button>
          </div>
        </>
      )}
        </>
      )}
    </div>
  )
}
