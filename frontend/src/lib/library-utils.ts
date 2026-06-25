export function libTradSym(tradition?: string | null): string {
  switch (tradition?.toUpperCase()) {
    case 'THERAVADA': return '☸️'
    case 'MAHAYANA': return '🪷'
    case 'VAJRAYANA': return '🔱'
    case 'NAVAYANA': return '🔵'
    case 'ZEN': return '🌸'
    case 'PURE_LAND': return '🌼'
    case 'TIBETAN': return '🏔️'
    case 'MULTIPLE': return '📚'
    default: return '📖'
  }
}

export function libTradClass(tradition?: string | null): string {
  switch (tradition?.toUpperCase()) {
    case 'THERAVADA': return 'lib-trad-theravada'
    case 'MAHAYANA': return 'lib-trad-mahayana'
    case 'VAJRAYANA': return 'lib-trad-vajrayana'
    case 'NAVAYANA': return 'lib-trad-navayana'
    default: return 'lib-trad-other'
  }
}

export function libTradBadgeClass(tradition?: string | null): string {
  switch (tradition?.toUpperCase()) {
    case 'THERAVADA': return 'lib-badge-theravada'
    case 'MAHAYANA': return 'lib-badge-mahayana'
    case 'VAJRAYANA': return 'lib-badge-vajrayana'
    case 'NAVAYANA': return 'lib-badge-navayana'
    default: return 'lib-badge-other'
  }
}

export const TRAD_LABELS: Record<string, string> = {
  THERAVADA: 'Theravāda',
  MAHAYANA: 'Mahāyāna',
  VAJRAYANA: 'Vajrayāna',
  NAVAYANA: 'Navayana',
  ZEN: 'Zen',
  PURE_LAND: 'Pure Land',
  TIBETAN: 'Tibetan',
  MULTIPLE: 'Multiple',
  OTHER: 'Other',
}

export function libTradLabel(tradition?: string | null): string {
  return tradition ? (TRAD_LABELS[tradition] ?? tradition) : 'Text'
}

const LANG_LABELS: Record<string, string> = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', sa: 'Sanskrit',
  pi: 'Pāli', pa: 'Punjabi', te: 'Telugu', ta: 'Tamil', gu: 'Gujarati',
}
export function libLangLabel(lang?: string | null): string {
  return lang ? (LANG_LABELS[lang] ?? lang.toUpperCase()) : ''
}

export function libGetCoverUrl(tx: { coverUrl?: string | null }): string | null {
  return tx.coverUrl ?? null
}

export function libShortTitle(title: string, max = 40): string {
  return title.length > max ? title.slice(0, max) + '…' : title
}

export function libReadingMins(segTotal: number): string {
  const mins = Math.ceil(segTotal * 30 / 200)
  if (mins < 60) return `~${mins}m`
  return `~${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
