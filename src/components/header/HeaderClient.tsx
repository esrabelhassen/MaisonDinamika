'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { MouseEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { useCart } from '@/lib/cart/CartContext'
import type { LogoRef } from '@/lib/media'
import Logo from '@/components/Logo'
import AuthNavItem from './AuthNavItem'
import ProduitsDropdown from './ProduitsDropdown'
import MobileDrawer from './MobileDrawer'
import type { CategoryNav, ContactData } from './types'

// Keep in sync with the `top-20` / `fixed inset-0 …` offsets used by the mega-panel
// and any hero spacing — this is the single source of truth for the bar's height.
const BAR_HEIGHT_CLASS = 'h-20'

// One shared "frosted glass" treatment for the header bar — same recipe on every
// page and at every scroll position (never a flat opaque color, never fully
// transparent), which is what used to leave the nav text with no backdrop at all
// over the room-tour hero. A translucent `paper` tint + blur+saturate lets
// whatever's behind it (hero photography included) show through softly while
// staying legible. The tint's opacity was contrast-checked (sRGB relative
// luminance, the same manual formula used elsewhere in this codebase) against
// the worst case — pure black directly behind it — and `ink` text still clears
// ~5.2:1 there, comfortably past the 4.5:1 AA floor for normal text; over the
// hero's actual (much lighter) photography it's higher still.
const GLASS_BAR_CLASS =
  'border-b border-paper/40 bg-paper/65 backdrop-blur-md backdrop-saturate-150 shadow-[0_1px_20px_-6px_rgba(42,38,32,0.15)]'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HeaderClient({
  locale,
  categories,
  contact,
  logo,
  brandName,
}: {
  locale: Locale
  categories: CategoryNav[]
  contact: ContactData
  logo: LogoRef | null
  brandName: string
}) {
  const nav = getNavDict(locale)
  const { count } = useCart()
  const pathname = usePathname()
  const isHome = pathname === paths.home(locale)

  function handleContactClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isHome) return
    const target = document.getElementById('contact')
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  // A premium slide-in underline (an `after:` pseudo-element scaled from 0 on
  // hover) on top of the color transition — always on now: the glass bar's
  // contrast is guaranteed regardless of what's behind it (see GLASS_BAR_CLASS),
  // so there's no more need for the old transparent-state's mix-blend-multiply
  // fallback, which used to leave legibility at the mercy of whatever hero
  // photo happened to be underneath.
  const linkClass =
    "relative rounded-sm px-1 py-2 text-ink transition-colors after:absolute after:inset-x-1 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-glaze-deep after:transition-transform after:duration-300 after:content-[''] hover:text-glaze-deep hover:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none"

  return (
    <header className={`fixed inset-x-0 top-0 z-50 ${BAR_HEIGHT_CLASS} ${GLASS_BAR_CLASS}`}>
      {/* Pinned to the header's own corner (the header is already `fixed`, which
          is what lets an `absolute` child position against it) — deliberately
          OUTSIDE the centered max-w-6xl/px-6 row below, so it sits in the actual
          page corner rather than the nav's centered reading column, and its
          (large) size never affects that row's flex layout at all. */}
      <Logo
        locale={locale}
        logo={logo}
        brandName={brandName}
        heightClassName="h-24 lg:h-48"
        textClassName="text-xl tracking-wide text-ink"
        linkClassName="absolute start-4 top-1 z-10"
      />

      {/* ps-6/pe-6 (not px-6): the corner logo is wide enough at its lg: size
          (h-48, ~192px, roughly square) to physically overlap the first nav
          link's hit area if the nav row started at the usual px-6 inset — the
          large lg:ps-64 reserves enough start-side room to clear it. Confirmed
          by clicking "Accueil" after this change; before it, the click landed
          on the logo instead of navigating. */}
      <div className="mx-auto flex h-full max-w-6xl items-center justify-end ps-6 pe-6 lg:ps-64">
        <nav className="hidden items-center gap-6 lg:flex" aria-label={nav.produits}>
          <Link href={paths.home(locale)} className={linkClass}>
            {nav.accueil}
          </Link>
          <Link href={paths.aPropos(locale)} className={linkClass}>
            {nav.aPropos}
          </Link>
          <ProduitsDropdown locale={locale} label={nav.produits} categories={categories} />
          <Link href={paths.collection(locale)} className={linkClass}>
            {nav.collection}
          </Link>
          <a href={paths.contact(locale)} onClick={handleContactClick} className={linkClass}>
            {nav.contact}
          </a>
          <AuthNavItem locale={locale} labels={nav} linkClassName={linkClass} />
          <Link href={paths.panier(locale)} className={`${linkClass} flex items-center gap-1.5`}>
            <CartIcon />
            <span>{nav.panier}</span>
            <span className="rounded-full bg-glaze px-1.5 text-xs text-paper">{count}</span>
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-ink lg:hidden">
          <Link href={paths.panier(locale)} aria-label={nav.panier} className="relative rounded-sm p-2">
            <CartIcon />
            <span className="absolute -end-0.5 -top-0.5 rounded-full bg-glaze px-1 text-[10px] leading-tight text-paper">
              {count}
            </span>
          </Link>
          <MobileDrawer
            locale={locale}
            nav={nav}
            categories={categories}
            contact={contact}
            onContactClick={handleContactClick}
          />
        </div>
      </div>
    </header>
  )
}

function CartIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h2l1.6 9.6a2 2 0 0 0 2 1.65h7.7a2 2 0 0 0 2-1.65L20 8H6"
      />
      <circle cx="9.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}
