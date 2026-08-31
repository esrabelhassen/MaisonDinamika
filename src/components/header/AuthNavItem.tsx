'use client'

import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import { useAuth } from '@/lib/auth/AuthContext'

export default function AuthNavItem({
  locale,
  labels,
  linkClassName,
  onNavigate,
}: {
  locale: Locale
  labels: { seConnecter: string; monCompte: string; seDeconnecter: string }
  linkClassName: string
  /** Called after a link click (mobile drawer closes itself) or after logout completes. */
  onNavigate?: () => void
}) {
  const { customer, loading, logout } = useAuth()

  // Renders the logged-out state while loading (matches the pre-hydration SSR
  // markup) rather than a spinner — there's nothing to flash to once /me resolves
  // fast, and it avoids a layout jump for the common logged-out visitor.
  if (loading || !customer) {
    return (
      <Link href={paths.connexion(locale)} onClick={onNavigate} className={linkClassName}>
        {labels.seConnecter}
      </Link>
    )
  }

  async function handleLogout() {
    await logout()
    onNavigate?.()
  }

  return (
    <>
      <Link href={paths.compte(locale)} onClick={onNavigate} className={linkClassName}>
        {labels.monCompte}
      </Link>
      <button type="button" onClick={handleLogout} className={linkClassName}>
        {labels.seDeconnecter}
      </button>
    </>
  )
}
