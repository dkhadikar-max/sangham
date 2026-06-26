'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { User } from '@/types'

interface AuthResponse {
  token: string
  refreshToken?: string
  user: User
}

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const { showToast } = useUiStore()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleMode() {
    setIsLoginMode((m) => !m)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isLoginMode && !displayName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!identifier.trim()) {
      setError('Please enter your email or phone number')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const isEmail = identifier.includes('@')

      if (isLoginMode) {
        const body = isEmail
          ? { email: identifier, password }
          : { phone: identifier, password }
        const data = await api.post<AuthResponse>('/auth/login', body)
        setAuth(data.user, data.token, data.refreshToken ?? '')
        router.replace('/feed')
      } else {
        const body = {
          password,
          displayName,
          ...(isEmail ? { email: identifier } : { phone: identifier }),
        }
        const data = await api.post<AuthResponse>('/auth/register', body)
        setAuth(data.user, data.token, data.refreshToken ?? '')
        router.replace('/onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-page"
      style={{ background: 'linear-gradient(180deg,var(--surface-bg) 0%,var(--saffron-50) 100%)' }}
    >
      <div className="auth-container">
        <div
          className="logo"
          style={{ justifyContent: 'center', cursor: 'pointer', marginBottom: 'var(--space-6)' }}
          onClick={() => router.push('/')}
        >
          <div className="logo-mark">
            <i className="fa-solid fa-dharmachakra" />
          </div>
          Sangham
        </div>

        <h2 className="auth-title">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLoginMode
            ? 'Continue your journey with Sangham.'
            : 'Begin your journey with Sangham.'}
        </p>

        {error && (
          <div
            className="auth-error show"
            style={{ animation: 'shake 0.3s ease' }}
          >
            {error}
          </div>
        )}

        <button
          className="passkey-btn"
          type="button"
          onClick={() => showToast('Passkey sign-in — coming soon', 'info')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Sign in with Passkey
        </button>

        <div className="divider">or continue with</div>

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Ananda"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}
          <div className="input-group">
            <label>Email or Phone</label>
            <input
              type="text"
              inputMode="email"
              className="input"
              placeholder="Enter email or phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner spinner-sm" />
            ) : isLoginMode ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isLoginMode ? 'New to Sangham?' : 'Already have an account?'}</span>{' '}
          <a onClick={toggleMode}>{isLoginMode ? 'Create Account' : 'Sign In'}</a>
        </div>
      </div>
    </div>
  )
}
