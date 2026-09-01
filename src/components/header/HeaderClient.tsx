'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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
const HEADER_HEIGHT_PX = 80 // h-20 = 5rem, assuming the default 16px root font size

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

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) return

    function handleScroll() {
      // Measure the actual hero section rather than guessing a viewport-height
      // ratio — "past the hero" should mean past ITS bottom edge, whatever its
      // real height is. The hero sits at `-mt-20` (pulled up under the fixed
      // header), so its bottom edge reaches the viewport top after scrolling by
      // (heroHeight - headerHeight).
      const heroEl = document.querySelector<HTMLElement>('[data-hero]')
      const heroHeight = heroEl?.offsetHeight ?? window.innerHeight
      const threshold = heroHeight - HEADER_HEIGHT_PX
      setScrolled(window.scrollY > threshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  const solid = !isHome || scrolled

  function handleContactClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isHome) return
    const target = document.getElementById('contact')
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const linkClass = `rounded-sm px-1 py-2 transition-colors motion-reduce:transition-none ${
    solid ? 'text-ink hover:text-glaze-deep' : 'mix-blend-multiply hover:opacity-80'
  }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${BAR_HEIGHT_CLASS} transition-colors duration-300 motion-reduce:transition-none motion-reduce:duration-0 ${
        solid ? 'border-b border-glaze-light bg-paper' : 'border-b border-transparent bg-transparent'
      }`}
    >
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
        textClassName={`text-xl tracking-wide ${solid ? 'text-ink' : 'mix-blend-multiply'}`}
        imageClassName={solid ? '' : 'mix-blend-multiply'}
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
          <ProduitsDropdown
            locale={locale}
            label={nav.produits}
            ensembleLabel={nav.ensemble}
            categories={categories}
            solid={solid}
          />
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

        <div className={`flex items-center gap-3 lg:hidden ${solid ? 'text-ink' : 'mix-blend-multiply'}`}>
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
