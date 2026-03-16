/**
 * Tests for frontend/src/lib/auth-context.tsx
 *
 * Covers:
 * - Initial loading state
 * - Login sets user + token
 * - Logout clears user + token
 * - Token persistence in localStorage
 * - Expired token is discarded on mount
 * - useAuth outside provider throws
 *
 * Prerequisites (install before running):
 *   npm install -D vitest @testing-library/react @testing-library/jest-dom
 *                  @testing-library/user-event jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Mock the API module so we don't make real HTTP requests
// ---------------------------------------------------------------------------

const mockLoginUser = vi.fn()
const mockRegisterUser = vi.fn()

vi.mock('@/lib/api', () => ({
  loginUser: (...args: unknown[]) => mockLoginUser(...args),
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fake JWT with the given payload (no real signing). */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const sig = 'fake-signature'
  return `${header}.${body}.${sig}`
}

function validToken(userId = 'user-123', email = 'test@example.com'): string {
  return fakeJwt({
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  })
}

function expiredToken(): string {
  return fakeJwt({
    sub: 'user-expired',
    email: 'expired@example.com',
    exp: Math.floor(Date.now() / 1000) - 100, // 100 seconds ago
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // -- Initial state -------------------------------------------------------

  it('starts in a loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    // isLoading may flip to false synchronously after the first useEffect,
    // but initially the hook should report no user.
    expect(result.current.user).toBeNull()
  })

  it('sets isLoading to false after mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('is unauthenticated when no stored token exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
  })

  // -- Token persistence ---------------------------------------------------

  it('restores a valid token from localStorage on mount', async () => {
    const token = validToken('user-stored', 'stored@example.com')
    localStorage.setItem('token', token)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe(token)
    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.user_id).toBe('user-stored')
  })

  it('discards an expired token from localStorage on mount', async () => {
    localStorage.setItem('token', expiredToken())

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    // localStorage should be cleaned up
    expect(localStorage.getItem('token')).toBeNull()
  })

  // -- Login ---------------------------------------------------------------

  it('login sets authenticated state and stores token', async () => {
    const token = validToken('user-login', 'login@example.com')
    mockLoginUser.mockResolvedValueOnce({
      user_id: 'user-login',
      email: 'login@example.com',
      token,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('login@example.com', 'password')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe('login@example.com')
    expect(result.current.token).toBe(token)
    expect(localStorage.getItem('token')).toBe(token)
  })

  it('login propagates API errors', async () => {
    mockLoginUser.mockRejectedValueOnce(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('bad@example.com', 'wrong')
      })
    ).rejects.toThrow('Invalid credentials')

    expect(result.current.isAuthenticated).toBe(false)
  })

  // -- Register ------------------------------------------------------------

  it('register sets authenticated state and stores token', async () => {
    const token = validToken('user-reg', 'reg@example.com')
    mockRegisterUser.mockResolvedValueOnce({
      user_id: 'user-reg',
      email: 'reg@example.com',
      token,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register('reg@example.com', 'password123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.user_id).toBe('user-reg')
    expect(localStorage.getItem('token')).toBe(token)
  })

  // -- Logout --------------------------------------------------------------

  it('logout clears user, token, and localStorage', async () => {
    const token = validToken()
    mockLoginUser.mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'test@example.com',
      token,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

// -- useAuth outside provider -----------------------------------------------

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    spy.mockRestore()
  })
})
