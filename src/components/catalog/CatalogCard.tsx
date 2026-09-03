'use client'

import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import { formatPriceTND } from '@/lib/price'
import { useCart } from '@/lib/cart/CartContext'

export type CatalogCardItem = {
  kind: 'product' | 'set'
  id: number
  name: string
  slug: string
  priceTND: number
  stock: number
  imageUrl: string | null
  imageAlt: string
}

export type CatalogCardLabels = {
  ensemble: string
  add: string
  added: string
  outOfStock: string
}

// The one card language for the whole storefront — first used for the Nouveauté
// section, reused everywhere else a product/set is listed (produits index, category
// grid) so nothing invents a second visual treatment. The image+name+price is a
// single link to the product page; "Add to cart" is a sibling action (always adds
// qty 1 — the full stepper lives on the product page itself), not nested inside
// that link, since a <button> can't legally nest inside an <a>.
export default function CatalogCard({
  locale,
  item,
  labels,
}: {
  locale: Locale
  item: CatalogCardItem
  labels: CatalogCardLabels
}) {
  const href = item.kind === 'set' ? paths.ensemble(locale, item.slug) : paths.produit(locale, item.slug)
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const outOfStock = item.stock <= 0

  // Cursor-tracked spotlight glow on the image (see the overlay div below) —
  // written straight to the element via a ref rather than React state, so
  // moving the pointer never triggers a re-render, just a cheap CSS custom
  // property write the compositor already has to read every frame anyway.
  const glowRef = useRef<HTMLDivElement>(null)
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = glowRef.current
    if (!el) return
    const rect = event.currentTarget.getBoundingClientRect()
    el.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
    el.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`)
  }

  function handleAdd() {
    if (outOfStock) return
    addItem({
      itemType: item.kind,
      id: item.id,
      slug: item.slug,
      name: item.name,
      priceTND: item.priceTND,
      image: item.imageUrl,
      maxStock: item.stock,
      qty: 1,
    })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div className="group min-w-0">
      <Link href={href} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glaze focus-visible:ring-offset-2">
        <div
          onPointerMove={handlePointerMove}
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-inset ring-transparent transition-shadow duration-500 group-hover:shadow-[0_20px_45px_-18px_rgba(94,115,134,0.45)] group-hover:ring-glaze/25 motion-reduce:transition-none"
        >
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          )}
          {/* Cursor-tracked spotlight — a premium whisper, not a spectacle: a soft
              glaze-tinted glow that follows the pointer, invisible until hover. */}
          <div
            ref={glowRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
            style={{
              background:
                'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(94,115,134,0.22), transparent 70%)',
            }}
          />
        </div>
        <h3 className="mt-4 text-xs uppercase tracking-[0.12em] text-ink transition-colors duration-300 group-hover:text-glaze-deep motion-reduce:transition-none">
          {item.name}
          {/* A real space, not just margin — margin isn't a line-break opportunity,
              so without this the name+badge become one unwrappable run of text. */}
          {item.kind === 'set' && ' '}
          {item.kind === 'set' && (
            <span className="ms-1.5 rounded-sm bg-glaze-light px-1.5 py-0.5 align-middle text-[10px] normal-case tracking-normal text-glaze-dark">
              {labels.ensemble}
            </span>
          )}
        </h3>
        <div className="mt-1 text-xs text-muted">{formatPriceTND(item.priceTND)}</div>
      </Link>

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="mt-3 w-full border border-glaze py-2.5 text-[11px] uppercase tracking-[0.14em] text-ink transition-all duration-300 hover:bg-glaze hover:text-paper hover:shadow-[0_8px_20px_-8px_rgba(94,115,134,0.5)] disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted disabled:hover:shadow-none motion-reduce:transition-none"
      >
        {outOfStock ? labels.outOfStock : justAdded ? labels.added : labels.add}
      </button>
    </div>
  )
}
