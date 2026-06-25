'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

export default function LandingPage() {
  const { token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (token) router.replace('/feed')
  }, [token, router])

  if (token) return null

  return (
    <div
      style={{
        backgroundColor: '#f8f5f0',
        color: '#2d2926',
        overflowX: 'hidden',
        position: 'relative',
        minHeight: '100svh',
      }}
    >
      <nav
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="logo-mark" style={{ width: 36, height: 36 }}>
            <i className="fa-solid fa-dharmachakra" style={{ fontSize: 16 }} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--text-primary)',
            }}
          >
            Sangham
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            opacity: 0.6,
          }}
        >
          {['Approach', 'Community', 'Knowledge'].map((label) => (
            <a
              key={label}
              href="#"
              style={{ textDecoration: 'none', color: 'inherit', transition: 'color .5s' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#C79A3B')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'inherit')}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100svh',
          textAlign: 'center',
          padding: '0 1.5rem',
          fontFamily: "'Inter', sans-serif",
          color: '#2d2926',
        }}
      >
        <h2
          style={{
            fontFamily: "'Noto Sans Devanagari', sans-serif",
            fontSize: '1.875rem',
            marginBottom: '0.75rem',
            opacity: 0.7,
          }}
        >
          संघं सरणं गच्छामि
        </h2>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(4rem, 12vw, 9rem)',
            marginBottom: '1.5rem',
            letterSpacing: '-0.025em',
            lineHeight: 1,
          }}
        >
          SANGHAM
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            fontWeight: 300,
            letterSpacing: '0.1em',
            marginBottom: '3rem',
            opacity: 0.8,
            textTransform: 'uppercase',
          }}
        >
          Where Knowledge Meets Community
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="/login"
            style={{
              padding: '1rem 2.5rem',
              border: '1px solid rgba(199,154,59,0.5)',
              color: '#C79A3B',
              textDecoration: 'none',
              transition: 'all .7s',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize: '0.875rem',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#C79A3B'
              e.currentTarget.style.color = 'white'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#C79A3B'
            }}
          >
            Enter Sangham
          </a>
          <a
            href="/login"
            style={{
              padding: '1rem 2.5rem',
              color: 'rgba(47,42,36,0.7)',
              textDecoration: 'underline',
              textUnderlineOffset: '8px',
              transition: 'all .7s',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize: '0.875rem',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#C79A3B')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(47,42,36,0.7)')}
          >
            Join the Network
          </a>
        </div>
      </main>
    </div>
  )
}
