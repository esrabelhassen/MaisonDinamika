'use client'

import { useRef, useState } from 'react'
import type { ImageRef, VariantGroups, VariantOption } from '@/lib/media'

type SectionKey = 'couleurs' | 'dimensions' | 'packs'

export type VariantSelectorLabels = {
  couleurs: string
  dimensions: string
  packs: string
}

// Renders up to three admin-configured sections (Pack / Dimension / Couleur) —
// a section with zero options simply isn't rendered at all, which is exactly
// what "leave it empty in the admin" means (see fields/variantOptions.ts).
// Picking an option can optionally swap the gallery's photo and/or the
// displayed price — see ProductDetailLayout.tsx, which owns both pieces of
// state this just reports into via onImageSelect/onPriceSelect.
export default function VariantSelector({
  variants,
  labels,
  onImageSelect,
  onPriceSelect,
}: {
  variants: VariantGroups
  labels: VariantSelectorLabels
  onImageSelect: (image: ImageRef | null) => void
  onPriceSelect: (priceTND: number | null) => void
}) {
  // Keyed by section so picking a colour doesn't clear the chosen pack, etc.
  const [selected, setSelected] = useState<Partial<Record<SectionKey, VariantOption>>>({})
  // Which sections were most recently (re)selected, oldest first — NOT
  // rendered, so a ref rather than state. Drives `recompute` below: when more
  // than one currently-selected section has its own image/price, the most
  // recently touched one wins. Removed from the list on deselect.
  const orderRef = useRef<SectionKey[]>([])

  // Recomputes the gallery photo and price from scratch on every change,
  // rather than patching them incrementally — that's what makes this correct
  // for the same-section case: switching FROM "Avec 2 tajines" (has a price)
  // TO "Avec 1 tajine" (doesn't) must adopt the newly-picked option's OWN
  // (lack of) price, not keep dangling the old one just because the new pick
  // itself has none — while switching to a DIFFERENT SECTION's price-less
  // option ("Beige") correctly leaves the pack's price in effect, since
  // Couleur was never providing a price to begin with. Scanning most-recent-
  // first naturally gets both right: it always prefers whatever the section
  // that just changed contributes (even if that's "nothing", which stops the
  // scan from falling through to a section it just doesn't include here
  // since it's still in the list), and only falls back to an older
  // still-selected section when the newest one truly has nothing to offer.
  function recompute(nextSelected: Partial<Record<SectionKey, VariantOption>>, order: SectionKey[]) {
    let image: ImageRef | null = null
    let priceTND: number | null = null
    for (let i = order.length - 1; i >= 0; i--) {
      const option = nextSelected[order[i]]
      if (!option) continue
      if (image === null && option.image) image = option.image
      if (priceTND === null && option.priceTND !== null) priceTND = option.priceTND
      if (image !== null && priceTND !== null) break
    }
    onImageSelect(image)
    onPriceSelect(priceTND)
  }

  function pick(key: SectionKey, option: VariantOption) {
    setSelected((prev) => {
      const next = { ...prev }
      let order = orderRef.current.filter((k) => k !== key)
      if (prev[key]?.label === option.label) {
        // Clicking the already-selected pill deselects it — otherwise, once a
        // variant with its own photo/price is picked, there'd be no way back
        // to the product's own defaults (or another still-selected section's
        // values) without deselecting.
        delete next[key]
      } else {
        next[key] = option
        order = [...order, key] // most-recently-touched goes last
      }
      orderRef.current = order
      recompute(next, order)
      return next
    })
  }

  function renderSection(key: SectionKey, title: string) {
    const options = variants[key]
    if (options.length === 0) return null
    return (
      <div className="mt-6" key={key}>
        <div className="text-sm text-muted">{title}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = selected[key]?.label === option.label
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => pick(key, option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors motion-reduce:transition-none ${
                  isActive
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink hover:border-glaze'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderSection('couleurs', labels.couleurs)}
      {renderSection('dimensions', labels.dimensions)}
      {renderSection('packs', labels.packs)}
    </div>
  )
}
