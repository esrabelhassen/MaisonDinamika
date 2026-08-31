'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type PublicCustomer = {
  id: number
  email: string
  fullName: string
  phone: string
}

export type SignupInput = {
  fullName: string
  email: string
  phone: string
  password: string
}

export class InvalidCredentialsError extends Error {}
export class DuplicateEmailError extends Error {}
export class AuthRequestError extends Error {}

type AuthContextValue = {
  customer: PublicCustomer | null
  /** True until the initial /me hydration request has completed. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toPublicCustomer(raw: unknown): PublicCustomer | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'number' && typeof r.id !== 'string') return null
  return {
    id: Number(r.id),
    email: typeof r.email === 'string' ? r.email : '',
    fullName: typeof r.fullName === 'string' ? r.fullName : '',
    phone: typeof r.phone === 'string' ? r.phone : '',
  }
}

async function fetchMe(): Promise<PublicCustomer | null> {
  try {
    const res = await fetch('/api/customers/me', { credentials: 'include', cache: 'no-store' })
    if (!res.ok) return null
    const data: unknown = await res.json()
    return toPublicCustomer((data as { user?: unknown } | null)?.user)
  } catch {
    return null
  }
}

/** Heuristic: Payload's validation error payload for a duplicate unique field
 * mentions the field name and "unique" somewhere in the error text. Good enough to
 * tell "email already used" apart from any other signup failure. */
async function isDuplicateEmailError(res: Response): Promise<boolean> {
  try {
    const data: unknown = await res.json()
    const text = JSON.stringify(data).toLowerCase()
    return text.includes('email') && (text.includes('unique') || text.includes('already'))
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Logged-out/loading on both server and first client render — /me is only ever
  // fetched in an effect, after mount, so there's nothing to mismatch.
  const [customer, setCustomer] = useState<PublicCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    fetchMe().then((c) => {
      if (cancelled) return
      setCustomer(c)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new InvalidCredentialsError()
      const data: unknown = await res.json()
      const publicCustomer = toPublicCustomer((data as { user?: unknown } | null)?.user)
      if (!publicCustomer) throw new AuthRequestError()
      setCustomer(publicCustomer)
      router.refresh()
    },
    [router],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        if (await isDuplicateEmailError(res.clone())) throw new DuplicateEmailError()
        throw new AuthRequestError()
      }
      // Creating the account doesn't establish a session — log in right after with
      // the same credentials.
      await login(input.email, input.password)
    },
    [login],
  )

  const logout = useCallback(async () => {
    await fetch('/api/customers/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setCustomer(null)
    router.refresh()
  }, [router])

  return (
    <AuthContext.Provider value={{ customer, loading, login, signup, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
