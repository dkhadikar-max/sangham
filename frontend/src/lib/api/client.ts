import { useAuthStore } from '@/stores/auth'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const { user, refreshToken, setAuth, clearAuth } = useAuthStore.getState()
    if (!refreshToken || !user) return null
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) throw new Error('refresh failed')
      const { token: newToken } = await res.json() as { token: string }
      setAuth(user, newToken, refreshToken)
      return newToken
    } catch {
      clearAuth()
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && token && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) return request<T>(method, path, body, newToken, true)
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const json = await res.json() as { error?: string; message?: string }
      message = json.error ?? json.message ?? message
    } catch {}
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string, token?: string) => request<T>('GET', path, undefined, token),
  post:   <T>(path: string, body: unknown, token?: string) => request<T>('POST', path, body, token),
  put:    <T>(path: string, body: unknown, token?: string) => request<T>('PUT', path, body, token),
  patch:  <T>(path: string, body: unknown, token?: string) => request<T>('PATCH', path, body, token),
  delete: <T>(path: string, token?: string) => request<T>('DELETE', path, undefined, token),
}
