'use client'

import { useReaderStore } from '@/stores/reader'
import { useLibraryBookmarks } from '@/hooks/useLibrary'
import { libTradSym, libTradClass, libLangLabel, libGetCoverUrl, libShortTitle } from '@/lib/library-utils'
import type { LibraryText } from '@/types'

interface Props {
  onBack: () => void
}

function TextRow({ tx, pct, onClick }: { tx: LibraryText; pct: number; onClick: () => void }) {
  const url = libGetCoverUrl(tx)
  const tc = libTradClass(tx.collection?.tradition)
  const sym = libTradSym(tx.collection?.tradition)
  const author = tx.translator ?? tx.author ?? ''
  return (
    <button type="button" className="lib-continue-card" onClick={onClick}>
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          style={{ width: 52, height: 70, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
        />
      ) : (
        <div className={`lib-continue-mini-cover ${tc}`} style={{ width: 52, height: 70, flexDirection: 'column', padding: 6, fontSize: '1rem' }}>
          <div className="lib-cover-sym-wrap" style={{ fontSize: '1.2rem' }}>{sym}</div>
          <div className="lib-cover-title-line" style={{ fontSize: 6 }}>{libShortTitle(tx.title, 25)}</div>
        </div>
      )}
      <div className="lib-continue-info">
        <div className="lib-continue-title">{libShortTitle(tx.title)}</div>
        <div className="lib-continue-sub">
          {author ? `${author} · ` : ''}{libLangLabel(tx.language)}
        </div>
        {pct > 0 && (
          <div className="lib-continue-progress">
            <div className="lib-continue-bar" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'var(--border-default)', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

export function BookmarksView({ onBack }: Props) {
  const { setCurrentText, progress } = useReaderStore()
  const { data: bookmarks = [], isLoading } = useLibraryBookmarks()

  return (
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      <button type="button" className="lib-breadcrumb" onClick={onBack}>
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        Library
      </button>

      {isLoading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🔖</div>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>No saved teachings yet</div>
          <div style={{ fontSize: '.875rem' }}>Open any text and tap the bookmark icon to save it here.</div>
        </div>
      ) : (
        <div className="lib-section">
          <div className="lib-section-header">
            <span className="lib-section-title">Saved Teachings</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{bookmarks.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {bookmarks.map((tx) => (
              <TextRow
                key={tx.id}
                tx={tx}
                pct={progress[tx.id]?.percent ?? 0}
                onClick={() => setCurrentText(tx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
