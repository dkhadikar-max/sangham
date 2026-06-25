'use client'

import type { AssociationSummary } from '@/types'
import { useJoinAssociationDirect } from '@/hooks/useCommunities'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useState } from 'react'

function tradStyle(tradition?: string | null) {
  switch (tradition) {
    case 'THERAVADA':
      return { grad: 'linear-gradient(135deg,#4ade80,#059669)', ibg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', iclr: '#16a34a', icon: 'fa-seedling' }
    case 'MAHAYANA':
      return { grad: 'linear-gradient(135deg,#fbbf24,#f97316)', ibg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', iclr: '#d97706', icon: 'fa-dharmachakra' }
    case 'VAJRAYANA':
      return { grad: 'linear-gradient(135deg,#c084fc,#4f46e5)', ibg: 'linear-gradient(135deg,#faf5ff,#f3e8ff)', iclr: '#9333ea', icon: 'fa-bell' }
    default:
      return { grad: 'linear-gradient(135deg,#fbbf24,#ca8a04)', ibg: 'linear-gradient(135deg,#F8F5EF,#F8F5EF)', iclr: '#C79A3B', icon: 'fa-heart' }
  }
}

interface Props {
  a: AssociationSummary
  onOpen: () => void
  isMember?: boolean
}

export function CommunityCard({ a, onOpen, isMember = false }: Props) {
  const ts = tradStyle(a.tradition)
  const { token } = useAuthStore()
  const { showToast } = useUiStore()
  const join = useJoinAssociationDirect()
  const [joined, setJoined] = useState(isMember)
  const cat = (a.category ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  const loc = a.city || a.country || ''
  const memberCount = a._count?.members ?? 0

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) { showToast('Sign in to join communities', 'info'); return }
    if (joined) return
    join.mutate(a.id, {
      onSuccess: () => { setJoined(true); showToast('Joined ' + a.name, 'success') },
      onError: (err) => showToast((err as Error).message, 'error'),
    })
  }

  return (
    <div
      className="community-card bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer"
      style={{ border: '1px solid rgba(199,154,59,0.1)' }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
    >
      {/* Gradient header */}
      <div className="h-24 relative" style={{ background: ts.grad }}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.1)' }} />
        <div className="absolute left-5" style={{ bottom: '-2rem' }}>
          <div className="w-16 h-16 rounded-2xl bg-white p-1" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ background: ts.ibg }}>
              <i className={`fa-solid ${ts.icon} text-xl`} style={{ color: ts.iclr }} />
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="pt-10 px-5 pb-5">
        <h3 className="font-semibold text-sangham-ink text-sm mb-0.5">
          {a.name}
          {a.isVerified && (
            <i className="fa-solid fa-circle-check ml-0.5 text-xs" style={{ color: '#C79A3B' }} title="Verified" />
          )}
        </h3>
        {loc && (
          <p className="text-xs text-sangham-brown-light flex items-center gap-1 mb-2">
            <i className="fa-solid fa-location-dot" style={{ fontSize: 10 }} />
            {loc}
          </p>
        )}
        {a.description ? (
          <p className="text-xs text-sangham-brown-light leading-relaxed mb-4 line-clamp-2">{a.description}</p>
        ) : (
          <div className="mb-4" />
        )}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-sangham-brown-light">{memberCount} members</span>
          {cat && (
            <span className="px-2 py-0.5 bg-sangham-cream text-sangham-brown-light text-[10px] font-medium rounded-md">
              {cat}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`join-btn flex-1 py-2.5 rounded-xl text-xs font-semibold${joined ? ' joined' : ' text-white'}`}
            style={joined ? {} : { background: 'linear-gradient(135deg,#C79A3B,#B2872F)', boxShadow: '0 4px 12px rgba(199,154,59,0.2)' }}
            onClick={handleJoin}
            disabled={join.isPending}
          >
            {joined ? 'Joined' : 'Join'}
          </button>
          <button
            className="comm-icon-btn rounded-xl bg-sangham-cream hover:bg-sangham-gold/10 flex items-center justify-center text-sangham-brown-light transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="Bookmark"
          >
            <i className="fa-regular fa-bookmark text-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}
