'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { useAuth, DuplicateEmailError } from '@/lib/auth/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = {
  fullName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  form?: string
}

// Same reasoning as LoginForm: no native <form>, to avoid a pre-hydration fallback
// submit putting the password in the URL/history.
export default function SignupForm({ locale, redirectTarget }: { locale: Locale; redirectTarget: string }) {
  const nav = getNavDict(locale)
  const { signup } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): Errors {
    const next: Errors = {}
    if (!fullName.trim()) next.fullName = nav.champRequis
    if (!email.trim()) next.email = nav.champRequis
    else if (!EMAIL_RE.test(email)) next.email = nav.emailInvalide
    if (!phone.trim()) next.phone = nav.champRequis
    if (!password) next.password = nav.champRequis
    if (!confirmPassword) next.confirmPassword = nav.champRequis
    else if (password && confirmPassword && password !== confirmPassword) {
      next.confirmPassword = nav.motsDePasseDifferents
    }
    return next
  }

  async function handleSubmit() {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await signup({ fullName, email, phone, password })
      router.push(redirectTarget)
    } catch (error) {
      setErrors({ form: error instanceof DuplicateEmailError ? nav.emailDejaUtilise : nav.erreurGenerique })
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

  const fields: Array<{
    id: string
    label: string
    type: string
    autoComplete: string
    value: string
    setValue: (v: string) => void
    error?: string
  }> = [
    { id: 'signup-fullname', label: nav.nomComplet, type: 'text', autoComplete: 'name', value: fullName, setValue: setFullName, error: errors.fullName },
    { id: 'signup-email', label: nav.email, type: 'email', autoComplete: 'email', value: email, setValue: setEmail, error: errors.email },
    { id: 'signup-phone', label: nav.telephone, type: 'tel', autoComplete: 'tel', value: phone, setValue: setPhone, error: errors.phone },
    { id: 'signup-password', label: nav.motDePasse, type: 'password', autoComplete: 'new-password', value: password, setValue: setPassword, error: errors.password },
    { id: 'signup-confirm', label: nav.confirmerMotDePasse, type: 'password', autoComplete: 'new-password', value: confirmPassword, setValue: setConfirmPassword, error: errors.confirmPassword },
  ]

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl text-ink">{nav.inscriptionTitre}</h1>

      <div className="mt-8 flex flex-col gap-5">
        {errors.form && (
          <p role="alert" className="rounded-lg bg-rim-brown/10 px-4 py-3 text-sm text-rim-brown">
            {errors.form}
          </p>
        )}

        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <label htmlFor={field.id} className="text-sm text-muted">
              {field.label}
            </label>
            <input
              id={field.id}
              type={field.type}
              autoComplete={field.autoComplete}
              value={field.value}
              disabled={submitting}
              onChange={(e) => field.setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={!!field.error}
              aria-describedby={field.error ? `${field.id}-error` : undefined}
              className="rounded-lg border border-glaze-light bg-white/60 px-4 py-2.5 text-ink disabled:opacity-60"
            />
            {field.error && (
              <p id={`${field.id}-error`} className="text-sm text-rim-brown">
                {field.error}
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-2 rounded-full bg-ink px-7 py-3 text-sm text-paper transition-colors hover:bg-glaze-deep disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {submitting ? nav.creationEnCours : nav.creerUnCompte}
        </button>
      </div>

      <p className="mt-6 text-sm text-muted">
        {nav.dejaUnCompte}{' '}
        <Link href={paths.connexion(locale)} className="text-glaze-deep hover:underline">
          {nav.seConnecter}
        </Link>
      </p>
    </div>
  )
}
