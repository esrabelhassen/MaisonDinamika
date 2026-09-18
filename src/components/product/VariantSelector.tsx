'use client'

import { useState } from 'react'
import type { ImageRef, VariantGroups } from '@/lib/media'

type SectionKey = 'couleurs' | 'dimensions' | 'packs'

export type VariantSelectorLabels = {
  couleurs: string
  dimensions: string
  packs: string
}

// Renders up to three admin-configured sections (Pack / Dimension / Couleur) —
// a section with zero options simply isn't rendered at all, which is exactly
// what "leave it empty in the admin" means (see fields/variantOptions.ts).
// Purely presentational: picking an option never changes price/stock, only
// (optionally) which photo the gallery shows — see ProductDetailLayout.tsx,
// which owns the actual "active image" state this just reports into.
export default function VariantSelector({
  variants,
  labels,
  onImageSelect,
}: {
  variants: VariantGroups
  labels: VariantSelectorLabels
  onImageSelect: (image: ImageRef | null) => void
}) {
  // Keyed by section so picking a colour doesn't clear the chosen pack, etc.
  // Each is independent — there's no rule that they must agree on the same
  // photo; whichever was clicked most recently wins the gallery's display.
  const [selected, setSelected] = useState<Partial<Record<SectionKey, string>>>({})

  function pick(key: SectionKey, label: string, image: ImageRef | null) {
    setSelected((prev) => {
      const next = { ...prev }
      if (prev[key] === label) {
        // Clicking the already-selected pill deselects it — otherwise, once a
        // variant with its own photo is picked, there'd be no way back to the
        // gallery's own default image without deselecting. Only clear the
        // gallery override if THIS option was the one providing it (`image`
        // truthy) — deselecting a no-image option never touches the photo.
        delete next[key]
        if (image) onImageSelect(null)
      } else {
        next[key] = label
        // Only override when this option actually has a photo: e.g. picking
        // "Petit" (no image) right after "Beige" (has one) must not blank the
        // gallery back to default — the two are independent characteristics,
        // and Petit having nothing to show is not the same as Petit wanting
        // the default shown.
        if (image) onImageSelect(image)
      }
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
            const isActive = selected[key] === option.label
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => pick(key, option.label, option.image)}
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
