'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { useAuth } from '@/lib/auth/AuthContext'

export default function AccountNav({ locale }: { locale: Locale }) {
  const nav = getNavDict(locale)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const links = [
    { href: paths.compte(locale), label: nav.mesCommandes },
    { href: paths.compteAdresses(locale), label: nav.mesAdresses },
    { href: paths.compteProfil(locale), label: nav.monProfil },
  ]

  async function handleLogout() {
    await logout()
    router.push(paths.home(locale))
  }

  return (
    <nav aria-label={nav.monCompte} className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {links.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm transition-colors motion-reduce:transition-none ${
              active ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 rounded-lg px-4 py-2.5 text-start text-sm text-muted hover:text-ink lg:mt-4"
      >
        {nav.seDeconnecter}
      </button>
    </nav>
  )
}
