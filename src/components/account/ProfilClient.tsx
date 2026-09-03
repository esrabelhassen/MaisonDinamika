'use client'

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { getNavDict } from '@/lib/i18n'
import Field from '@/components/form/Field'
import { updateProfile } from '@/lib/account/updateProfile'
import { changePassword } from '@/lib/account/changePassword'

export default function ProfilClient({
  locale,
  initialFullName,
  initialPhone,
  email,
}: {
  locale: Locale
  initialFullName: string
  initialPhone: string
  email: string
}) {
  const nav = getNavDict(locale)
  const router = useRouter()

  // --- Name / phone ---
  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({})
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  function validateProfile() {
    const next: typeof profileErrors = {}
    if (!fullName.trim()) next.fullName = nav.champRequis
    if (!phone.trim()) next.phone = nav.champRequis
    return next
  }

  async function handleProfileSave() {
    const nextErrors = validateProfile()
    setProfileErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setProfileSubmitting(true)
    setProfileMessage(null)
    try {
      const result = await updateProfile({ fullName, phone })
      if (result.ok) {
        setProfileMessage(nav.profilMisAJour)
        router.refresh()
      } else {
        setProfileMessage(nav.erreurGenerique)
      }
    } catch {
      setProfileMessage(nav.erreurGenerique)
    } finally {
      setProfileSubmitting(false)
    }
  }

  function handleProfileKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleProfileSave()
    }
  }

  // --- Password ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
    form?: string
  }>({})
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  function validatePassword() {
    const next: typeof passwordErrors = {}
    if (!currentPassword) next.currentPassword = nav.champRequis
    if (!newPassword) next.newPassword = nav.champRequis
    else if (newPassword.length < 8) next.newPassword = nav.motDePasseTropCourt
    if (!confirmPassword) next.confirmPassword = nav.champRequis
    else if (newPassword && confirmPassword !== newPassword) next.confirmPassword = nav.motsDePasseDifferents
    return next
  }

  async function handlePasswordSave() {
    const nextErrors = validatePassword()
    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPasswordSubmitting(true)
    setPasswordMessage(null)
    try {
      const result = await changePassword({ currentPassword, newPassword })
      if (result.ok) {
        setPasswordMessage(nav.motDePasseModifie)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else if (result.reason === 'wrong-password') {
        setPasswordErrors({ form: nav.motDePasseActuelIncorrect })
      } else if (result.reason === 'weak-password') {
        setPasswordErrors({ newPassword: nav.motDePasseTropCourt })
      } else {
        setPasswordErrors({ form: nav.erreurGenerique })
      }
    } catch {
      setPasswordErrors({ form: nav.erreurGenerique })
    } finally {
      setPasswordSubmitting(false)
    }
  }

  function handlePasswordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handlePasswordSave()
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-2xl border border-line bg-surface/40 p-8">
        <h2 className="font-display text-xl text-ink">{nav.informationsPersonnelles}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="profile-fullname"
            label={nav.nomComplet}
            value={fullName}
            onChange={setFullName}
            onKeyDown={handleProfileKeyDown}
            disabled={profileSubmitting}
            error={profileErrors.fullName}
          />
          <Field
            id="profile-phone"
            label={nav.telephone}
            value={phone}
            onChange={setPhone}
            onKeyDown={handleProfileKeyDown}
            disabled={profileSubmitting}
            error={profileErrors.phone}
            type="tel"
          />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="profile-email" className="text-sm text-muted">
              {nav.email}
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              readOnly
              className="rounded-lg border border-line bg-surface/60 px-4 py-2.5 text-muted"
            />
            <p className="text-xs text-muted">{nav.emailNonModifiable}</p>
          </div>
        </div>

        {profileMessage && (
          <p role="status" className="mt-4 text-sm text-glaze">
            {profileMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleProfileSave}
          disabled={profileSubmitting}
          className="mt-4 rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {profileSubmitting ? nav.enregistrementEnCours : nav.enregistrer}
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-surface/40 p-8">
        <h2 className="font-display text-xl text-ink">{nav.changerMotDePasse}</h2>

        {passwordErrors.form && (
          <p role="alert" className="mt-4 rounded-lg bg-rim-brown/10 px-4 py-3 text-sm text-rim-brown">
            {passwordErrors.form}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="current-password"
            label={nav.motDePasseActuel}
            value={currentPassword}
            onChange={setCurrentPassword}
            onKeyDown={handlePasswordKeyDown}
            disabled={passwordSubmitting}
            error={passwordErrors.currentPassword}
            type="password"
            className="sm:col-span-2"
          />
          <Field
            id="new-password"
            label={nav.nouveauMotDePasse}
            value={newPassword}
            onChange={setNewPassword}
            onKeyDown={handlePasswordKeyDown}
            disabled={passwordSubmitting}
            error={passwordErrors.newPassword}
            type="password"
          />
          <Field
            id="confirm-password"
            label={nav.confirmerNouveauMotDePasse}
            value={confirmPassword}
            onChange={setConfirmPassword}
            onKeyDown={handlePasswordKeyDown}
            disabled={passwordSubmitting}
            error={passwordErrors.confirmPassword}
            type="password"
          />
        </div>

        {passwordMessage && (
          <p role="status" className="mt-4 text-sm text-glaze">
            {passwordMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handlePasswordSave}
          disabled={passwordSubmitting}
          className="mt-4 rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {passwordSubmitting ? nav.enregistrementEnCours : nav.changerMotDePasse}
        </button>
      </section>
    </div>
  )
}
