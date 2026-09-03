'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/CartContext'
import type { CartItemType } from '@/lib/cart/types'

export type AddToCartLabels = {
  add: string
  outOfStock: string
  added: string
  decrease: string
  increase: string
}

export default function AddToCart({
  itemType,
  id,
  slug,
  name,
  priceTND,
  image,
  maxStock,
  labels,
}: {
  itemType: CartItemType
  id: number
  slug: string
  name: string
  priceTND: number
  image: string | null
  maxStock: number
  labels: AddToCartLabels
}) {
  const { addItem, count } = useCart()
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const outOfStock = maxStock <= 0

  function handleAdd() {
    if (outOfStock) return
    addItem({ itemType, id, slug, name, priceTND, image, maxStock, qty })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2500)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
          <button
            type="button"
            aria-label={labels.decrease}
            disabled={outOfStock}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg disabled:opacity-40"
          >
            −
          </button>
          <span aria-live="polite" className="w-6 text-center tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            aria-label={labels.increase}
            disabled={outOfStock}
            onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted motion-reduce:transition-none"
        >
          {outOfStock ? labels.outOfStock : labels.add}
        </button>
      </div>

      <div
        aria-live="polite"
        className={`mt-3 text-sm text-glaze transition-opacity motion-reduce:transition-none ${
          justAdded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {justAdded && `${labels.added} (${count})`}
      </div>
    </div>
  )
}
