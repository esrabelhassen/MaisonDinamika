'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { useAuth } from '@/lib/auth/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Deliberately not a native <form>: if JS hasn't hydrated yet, a bare <form> falls
// back to a real GET submission to the current URL — which would put the password in
// the address bar and server logs. Controlled inputs + a plain button sidestep that
// failure mode entirely; Enter-to-submit is wired by hand below instead.
export default function LoginForm({ locale, redirectTarget }: { locale: Locale; redirectTarget: string }) {
  const nav = getNavDict(locale)
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next: typeof errors = {}
    if (!email.trim()) next.email = nav.champRequis
    else if (!EMAIL_RE.test(email)) next.email = nav.emailInvalide
    if (!password) next.password = nav.champRequis
    return next
  }

  async function handleSubmit() {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      // Generic error, deliberately — never reveal whether the email exists.
      await login(email, password)
      router.push(redirectTarget)
    } catch {
      setErrors({ form: nav.erreurConnexion })
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 sm:py-24">
      <h1 className="font-display text-3xl text-ink">{nav.connexionTitre}</h1>

      <div className="mt-8 flex flex-col gap-5">
        {errors.form && (
          <p role="alert" className="rounded-lg bg-rim-brown/10 px-4 py-3 text-sm text-rim-brown">
            {errors.form}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm text-muted">
            {nav.email}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={submitting}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className="rounded-lg border border-line bg-paper/60 px-4 py-2.5 text-ink transition-all duration-300 focus:border-glaze focus:shadow-[0_0_0_3px_rgba(94,115,134,0.15)] disabled:opacity-60 motion-reduce:transition-none"
          />
          {errors.email && (
            <p id="login-email-error" className="text-sm text-rim-brown">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-sm text-muted">
            {nav.motDePasse}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={submitting}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className="rounded-lg border border-line bg-paper/60 px-4 py-2.5 text-ink transition-all duration-300 focus:border-glaze focus:shadow-[0_0_0_3px_rgba(94,115,134,0.15)] disabled:opacity-60 motion-reduce:transition-none"
          />
          {errors.password && (
            <p id="login-password-error" className="text-sm text-rim-brown">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-2 rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-all duration-300 hover:bg-glaze hover:text-paper hover:shadow-[0_10px_28px_-12px_rgba(94,115,134,0.5)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {submitting ? nav.connexionEnCours : nav.seConnecter}
        </button>
      </div>

      <p className="mt-6 text-sm text-muted">
        {nav.pasDeCompte}{' '}
        <Link href={paths.inscription(locale)} className="text-glaze-deep hover:underline">
          {nav.creerUnCompte}
        </Link>
      </p>
    </div>
  )
}
