import React from 'react'
import { headers } from 'next/headers'
import { Fraunces, Inter } from 'next/font/google'
import { defaultLocale, dirFor, isValidLocale } from '@/lib/i18n'
import { CartProvider } from '@/lib/cart/CartContext'
import { AuthProvider } from '@/lib/auth/AuthContext'
import DreamyBackground from '@/components/ambient/DreamyBackground'
import CeramicSilhouettes from '@/components/ambient/CeramicSilhouettes'
import './globals.css'

// Self-hosted at build time (next/font downloads + serves the font files itself) —
// no runtime request to Google's CDN, so the storefront still renders offline.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'Maison Dinamika',
  description: 'Vaisselle et art de la table.',
}

// This is a route-group root layout (it owns <html>/<body>) separate from the
// (payload) admin's own root layout — Tailwind is imported only here, so it never
// touches /admin.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  // middleware.ts stamps these on every (frontend) request; fall back defensively
  // in case a request ever reaches this layout without going through middleware.
  const locale = headerList.get('x-locale') ?? defaultLocale
  const dir = headerList.get('x-locale-dir') ?? dirFor(isValidLocale(locale) ? locale : defaultLocale)

  return (
    <html lang={locale} dir={dir} className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {/* Mounted once, first in <body> — see the component for why `fixed` +
            a negative z-index here is enough to sit behind the transparent hero
            canvas without touching any hero rig file. */}
        <DreamyBackground />
        {/* Above the blooms, below page content; fades in once the home route's
            hero has fully scrolled past — see the component for the exclusion
            logic (no hero file imported or modified). */}
        <CeramicSilhouettes />
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
