'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ImageRef, VariantGroups } from '@/lib/media'
import Gallery from './Gallery'
import VariantSelector from './VariantSelector'
import type { VariantSelectorLabels } from './VariantSelector'

// Owns the one piece of state the gallery (left column) and the variant
// selector (right column, interleaved with the rest of the product's details)
// need to share — everything else on the page stays server-rendered and is
// simply passed through as already-built elements via `children`/`belowVariants`.
export default function ProductDetailLayout({
  images,
  altFallback,
  variants,
  labels,
  children,
  belowVariants,
}: {
  images: ImageRef[]
  altFallback: string
  variants: VariantGroups
  labels: VariantSelectorLabels
  /** Title, price, stock notice, description, etc. — rendered above the
   * variant selector. */
  children: ReactNode
  /** The add-to-cart control — rendered below the variant selector. */
  belowVariants: ReactNode
}) {
  const [overrideImage, setOverrideImage] = useState<ImageRef | null>(null)

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <Gallery
        images={images}
        altFallback={altFallback}
        overrideImage={overrideImage}
        onOverrideConsumed={() => setOverrideImage(null)}
      />
      <div>
        {children}
        <VariantSelector variants={variants} labels={labels} onImageSelect={setOverrideImage} />
        {belowVariants}
      </div>
    </div>
  )
}
