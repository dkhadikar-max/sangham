'use client'

import { useReaderStore } from '@/stores/reader'
import { useLibraryCollections, useLibrarySearch } from '@/hooks/useLibrary'
import {
  libTradSym,
  libTradClass,
  libLangLabel,
  libGetCoverUrl,
  libShortTitle,
  libReadingMins,
} from '@/lib/library-utils'
import type { LibraryText } from '@/types'

interface Props {
  collectionId: string
  onBack: () => void
}

function TextCard({ tx, pct, onClick }: { tx: LibraryText; pct: number; onClick: () => void }) {
  const url = libGetCoverUrl(tx)
  const tc = libTradClass(tx.collection?.tradition)
  const sym = libTradSym(tx.collection?.tradition)
  const author = tx.translator ?? tx.author ?? ''
  const mins = tx.segmentsTotal ? libReadingMins(tx.segmentsTotal) : ''
  const fb = (
    <div className={`lib-text-card-sym ${tc}`}>
      <div className="lib-cover-sym-wrap">{sym}</div>
      <div className="lib-cover-title-line">{libShortTitle(tx.title, 30)}</div>
      <div className="lib-cover-brand-line">Sangham</div>
    </div>
  )
  return (
    <button type="button" className="lib-text-card" onClick={onClick}>
      {url ? (
        <>
          <img
            src={url}
            alt=""
            loading="lazy"
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', display: 'block', boxShadow: '0 3px 10px rgba(0,0,0,0.18)' }}
          />
        </>
      ) : fb}
      <div className="lib-text-card-title">{libShortTitle(tx.title)}</div>
      {author && (
        <div className="lib-text-card-meta" style={{ marginTop: 2, marginBottom: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{author}</span>
        </div>
      )}
      <div className="lib-text-card-meta">
        <span className="lib-text-card-lang">{libLangLabel(tx.language)}</span>
        {mins && <span>{mins}</span>}
      </div>
      {pct > 0 && (
        <div className="lib-text-card-prog">
          <div className="lib-text-card-progfill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  )
}

export function CollectionView({ collectionId, onBack }: Props) {
  const { setCurrentText, progress } = useReaderStore()
  const { data: collections = [] } = useLibraryCollections()
  const { data: texts = [], isLoading } = useLibrarySearch({ collectionId, limit: 60 })

  const coll = collections.find((c) => c.id === collectionId)
  const sym = libTradSym(coll?.tradition)
  const tc = libTradClass(coll?.tradition)
  const langs = (coll?.languages ?? []).map((l) => (
    <span key={l} className="lib-coll-hero-tag">{libLangLabel(l)}</span>
  ))

  return (
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      <button type="button" className="lib-breadcrumb" onClick={onBack}>
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        All Collections
      </button>

      {coll && (
        <div className={`lib-coll-hero ${tc}`}>
          <div className="lib-coll-hero-sym">{sym}</div>
          <div>
            <div className="lib-coll-hero-name">{coll.name}</div>
            {coll.description && (
              <div className="lib-coll-hero-desc">
                {coll.description.slice(0, 160)}{coll.description.length > 160 ? '…' : ''}
              </div>
            )}
            <div className="lib-coll-hero-tags">
              <span className="lib-coll-hero-tag">{texts.length} texts</span>
              {langs}
              {coll.licence && <span className="lib-coll-hero-tag">{coll.licence}</span>}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div className="lib-text-grid">
          {texts.map((tx) => (
            <TextCard
              key={tx.id}
              tx={tx}
              pct={progress[tx.id]?.percent ?? 0}
              onClick={() => setCurrentText(tx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
