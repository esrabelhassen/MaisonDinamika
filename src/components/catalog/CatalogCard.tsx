'use client'

import { useState } from 'react'
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
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          )}
        </div>
        <h3 className="mt-4 text-xs uppercase tracking-[0.12em] text-ink">
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
        className="mt-3 w-full border border-glaze py-2.5 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-glaze hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted motion-reduce:transition-none"
      >
        {outOfStock ? labels.outOfStock : justAdded ? labels.added : labels.add}
      </button>
    </div>
  )
}
