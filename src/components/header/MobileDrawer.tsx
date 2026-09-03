'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import { useBodyScrollLock, useFocusTrap } from './useFocusTrap'
import AuthNavItem from './AuthNavItem'
import type { CategoryNav, ContactData } from './types'

type NavDict = {
  accueil: string
  aPropos: string
  produits: string
  collection: string
  contact: string
  panier: string
  ensemble: string
  fermer: string
  ouvrirMenu: string
  seConnecter: string
  monCompte: string
  seDeconnecter: string
}

export default function MobileDrawer({
  locale,
  nav,
  categories,
  contact,
  onContactClick,
}: {
  locale: Locale
  nav: NavDict
  categories: CategoryNav[]
  contact: ContactData
  onContactClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const [open, setOpen] = useState(false)
  const [produitsExpanded, setProduitsExpanded] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useFocusTrap(drawerRef, open, close)
  useBodyScrollLock(open)

  function openDrawer() {
    setOpen(true)
    requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    })
  }

  const contactLinks = [
    contact.phone ? { href: `tel:${contact.phone}`, label: contact.phone } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: contact.email } : null,
    contact.facebook ? { href: contact.facebook, label: 'Facebook' } : null,
    contact.instagram ? { href: contact.instagram, label: 'Instagram' } : null,
  ].filter((link): link is { href: string; label: string } => link !== null)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        aria-label={nav.ouvrirMenu}
        onClick={openDrawer}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-sm lg:hidden"
      >
        <span aria-hidden className="h-0.5 w-6 bg-current" />
        <span aria-hidden className="h-0.5 w-6 bg-current" />
        <span aria-hidden className="h-0.5 w-6 bg-current" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={nav.fermer}
            onClick={close}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            id="mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={nav.produits}
            className="absolute inset-y-0 start-0 flex w-[85vw] max-w-sm flex-col overflow-y-auto bg-paper p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={close}
              className="mb-6 self-end rounded-sm px-2 py-1 text-sm text-muted hover:text-ink"
            >
              {nav.fermer}
            </button>

            <nav className="flex flex-col gap-1 text-lg">
              <Link href={paths.home(locale)} onClick={close} className="rounded-sm py-3">
                {nav.accueil}
              </Link>
              <Link href={paths.aPropos(locale)} onClick={close} className="rounded-sm py-3">
                {nav.aPropos}
              </Link>

              <div>
                <button
                  type="button"
                  aria-expanded={produitsExpanded}
                  aria-controls="mobile-produits-panel"
                  onClick={() => setProduitsExpanded((value) => !value)}
                  className="flex w-full items-center justify-between rounded-sm py-3 text-left"
                >
                  {nav.produits}
                  <span aria-hidden className={produitsExpanded ? 'rotate-180' : ''}>
                    ⌄
                  </span>
                </button>
                {produitsExpanded && (
                  <div id="mobile-produits-panel" className="ms-3 flex flex-col gap-4 border-s border-line ps-3 pb-2">
                    {categories.map((category) => (
                      <div key={category.id}>
                        <Link
                          href={paths.categorie(locale, category.slug)}
                          onClick={close}
                          className="block py-1 font-display text-base"
                        >
                          {category.name}
                        </Link>
                        <ul className="flex flex-col gap-1 ps-2">
                          {category.products.map((product) => (
                            <li key={`m-product-${product.id}`}>
                              <Link
                                href={paths.produit(locale, product.slug)}
                                onClick={close}
                                className="block py-1 text-sm text-muted"
                              >
                                {product.name}
                              </Link>
                            </li>
                          ))}
                          {category.sets.map((set) => (
                            <li key={`m-set-${set.id}`}>
                              <Link
                                href={paths.ensemble(locale, set.slug)}
                                onClick={close}
                                className="block py-1 text-sm text-muted"
                              >
                                {set.name} <span className="text-xs">({nav.ensemble})</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link href={paths.collection(locale)} onClick={close} className="rounded-sm py-3">
                {nav.collection}
              </Link>
              <a
                href={paths.contact(locale)}
                onClick={(event) => {
                  onContactClick(event)
                  close()
                }}
                className="rounded-sm py-3"
              >
                {nav.contact}
              </a>
              <Link href={paths.panier(locale)} onClick={close} className="rounded-sm py-3">
                {nav.panier}
              </Link>

              <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
                <AuthNavItem locale={locale} labels={nav} linkClassName="rounded-sm py-3 text-left" onNavigate={close} />
              </div>
            </nav>

            {contactLinks.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 text-sm text-muted">
                {contactLinks.map((link) => (
                  <a key={link.href} href={link.href} className="hover:text-ink">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
