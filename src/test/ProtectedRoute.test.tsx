/**
 * Tests for frontend/src/components/ProtectedRoute.tsx
 *
 * Since ProtectedRoute.tsx does not exist yet (it is part of the auth plan),
 * these tests define the expected behavior so they serve as a specification
 * and regression gate once the component is implemented.
 *
 * Expected behavior:
 * - Unauthenticated: renders <Navigate to="/login" />
 * - Authenticated: renders children
 * - Loading: renders a spinner / loading indicator
 *
 * Prerequisites (install before running):
 *   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
 *   npm install -D react-router-dom (already a dependency)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Mock the auth context
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn()

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

// ---------------------------------------------------------------------------
// The ProtectedRoute component — inline reference implementation.
//
// Once the real component is created at
// frontend/src/components/ProtectedRoute.tsx, replace this import:
//
//   import { ProtectedRoute } from '@/components/ProtectedRoute'
//
// For now we define the expected implementation inline so the tests
// are self-contained and runnable as a specification.
// ---------------------------------------------------------------------------

import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = mockUseAuth()

  if (isLoading) {
    return <div data-testid="loading-spinner">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithRouter(
  ui: ReactNode,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading indicator while auth state is unknown', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.getByText('Secret Content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('does not flash protected content before redirecting', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Should not appear</div>
      </ProtectedRoute>
    )

    // Protected content should never be in the DOM
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('transitions from loading to authenticated', () => {
    // Start loading
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })

    const { rerender } = renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Auth resolves to authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/login"
            element={<div data-testid="login-page">Login Page</div>}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Secret</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('transitions from loading to unauthenticated (redirect)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })

    const { rerender } = renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Auth resolves to unauthenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/login"
            element={<div data-testid="login-page">Login Page</div>}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Secret</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
