'use client'

import { useUiStore } from '@/stores/ui'

export function ToastStack() {
  const { toasts } = useUiStore()

  if (!toasts.length) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height) + var(--space-4) + var(--safe-area-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        zIndex: 100,
        pointerEvents: 'none',
        alignItems: 'center',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '10px var(--space-4)',
            background:
              t.type === 'success'
                ? 'var(--success-500)'
                : t.type === 'error'
                  ? 'var(--error-500)'
                  : 'var(--stone-700)',
            color: 'var(--text-inverse)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            boxShadow: 'var(--shadow-4)',
            animation: 'fadeIn var(--duration-normal) var(--ease-out)',
            maxWidth: '320px',
            textAlign: 'center',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
