import React from 'react'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { isValidLocale, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import AccountNav from '@/components/account/AccountNav'

export default async function CompteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  // Gates the whole /compte subtree. Individual pages still call getCustomer() again
  // themselves — they need the customer object for their own owner-scoped queries
  // anyway, so this isn't purely redundant, but it does mean an anonymous visitor
  // never renders any /compte page at all, at the layout level.
  const customer = await getCustomer()
  if (!customer) {
    // The layout renders before its child page, so it can't rely on a page-level
    // redirect to send the visitor back to the SPECIFIC sub-page they asked for
    // (e.g. /compte/adresses, not just /compte) — middleware stamps the real
    // pathname for exactly this. Falls back to the plain /compte path if that
    // header is ever missing (e.g. a request that bypassed middleware somehow).
    const headerList = await headers()
    const currentPath = headerList.get('x-pathname') ?? paths.compte(locale)
    redirect(`${paths.connexion(locale)}?redirect=${encodeURIComponent(currentPath)}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <AccountNav locale={locale} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
