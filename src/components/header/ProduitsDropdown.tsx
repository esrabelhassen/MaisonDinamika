'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import { useClickOutside, useFocusTrap } from './useFocusTrap'
import type { CategoryNav } from './types'

export default function ProduitsDropdown({
  locale,
  label,
  categories,
}: {
  locale: Locale
  label: string
  categories: CategoryNav[]
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useFocusTrap(panelRef, open, close)
  useClickOutside([buttonRef, panelRef], open, () => setOpen(false))

  function toggle() {
    setOpen((wasOpen) => {
      const next = !wasOpen
      if (next) {
        // Move focus into the panel once it's mounted.
        requestAnimationFrame(() => {
          const firstLink = panelRef.current?.querySelector<HTMLElement>('a, button')
          firstLink?.focus()
        })
      }
      return next
    })
  }

  return (
    <div className="static lg:relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="produits-mega-panel"
        onClick={toggle}
        className="relative rounded-sm px-1 py-2 text-ink transition-colors after:absolute after:inset-x-1 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-glaze-deep after:transition-transform after:duration-300 after:content-[''] hover:text-glaze-deep hover:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none"
      >
        {label}
      </button>

      {/* Portaled to <body>, not rendered in place inside <header>: the header
          carries `backdrop-blur` for its glass effect, and `backdrop-filter`
          (like `transform`/`filter`) makes an element a new containing block for
          any `position: fixed` descendant. `top-20`/`inset-x-0` here happened to
          still land in the right place regardless (the header's own box already
          starts at the real viewport's top-left and spans its full width, so the
          two containing blocks are geometrically identical for this panel) — but
          that was a coincidence of this exact layout, not something to keep
          relying on. See MobileDrawer.tsx, which hit the same rule with a real,
          visible bug (its `fixed inset-0` didn't have that coincidence to save
          it). Portaling out from under the header sidesteps the rule entirely. */}
      {open &&
        createPortal(
          <div
            id="produits-mega-panel"
            ref={panelRef}
            role="region"
            aria-label={label}
            className="fixed inset-x-0 top-20 z-40 border-b border-line bg-paper shadow-lg"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-8 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <div key={category.id} className="flex max-h-80 flex-col">
                  {/* Category is a grouping label only — not a link, has no page
                      of its own. Only its sous-catégories below are clickable. */}
                  <div className="mb-3 font-display text-lg text-ink">{category.name}</div>
                  <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {category.sousCategories.map((sousCategorie) => (
                      <li key={`sc-${sousCategorie.id}`}>
                        <Link
                          href={paths.sousCategorie(locale, sousCategorie.slug)}
                          onClick={close}
                          className="text-sm text-muted hover:text-ink"
                        >
                          {sousCategorie.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
