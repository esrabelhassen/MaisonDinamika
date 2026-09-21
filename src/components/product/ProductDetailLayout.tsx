'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ImageRef, VariantGroups } from '@/lib/media'
import { formatPriceTND } from '@/lib/price'
import type { CartItemType } from '@/lib/cart/types'
import Gallery from './Gallery'
import VariantSelector from './VariantSelector'
import type { VariantSelectorLabels } from './VariantSelector'
import AddToCart from '@/components/cart/AddToCart'
import type { AddToCartLabels } from '@/components/cart/AddToCart'

// Owns the state the gallery (left column) and the variant selector (right
// column, interleaved with the rest of the product's details) need to share —
// everything else on the page stays server-rendered and is passed through as
// already-built elements via `title`/`details`. AddToCart is rendered HERE
// (not passed in as a render-prop) for a boring but important reason: a
// Server Component can't hand a plain function down to a Client Component —
// only serializable data crosses that boundary — so the add-to-cart DATA
// (`addToCart` below) comes from the server-rendered page as plain
// id/slug/name/etc., and this client component assembles the actual
// <AddToCart> element itself, feeding it the live (possibly variant-
// overridden) price.
//
// Two pieces of shared state: which photo the gallery shows, and which price
// is displayed/added to cart — both start at the product/set's own defaults
// and only change when a variant option that actually carries its own
// image/price is selected (see VariantSelector.tsx for why a plain option
// never clobbers either).
export default function ProductDetailLayout({
  images,
  altFallback,
  variants,
  labels,
  basePriceTND,
  title,
  details,
  addToCart,
}: {
  images: ImageRef[]
  altFallback: string
  variants: VariantGroups
  labels: VariantSelectorLabels
  basePriceTND: number
  /** Just the heading (name, "Ensemble" badge, etc.) — rendered above the
   * price. Split out from `details` so the reactive price line can sit
   * between the two, in its original spot. */
  title: ReactNode
  /** Stock notice, description, components list, etc. — rendered below the
   * price. */
  details: ReactNode
  /** Everything AddToCart needs except the live price (see the component doc
   * comment above for why this is plain data rather than a rendered element). */
  addToCart: {
    itemType: CartItemType
    id: number
    slug: string
    name: string
    image: string | null
    maxStock: number
    labels: AddToCartLabels
  }
}) {
  const [overrideImage, setOverrideImage] = useState<ImageRef | null>(null)
  const [priceTND, setPriceTND] = useState(basePriceTND)

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <Gallery
        images={images}
        altFallback={altFallback}
        overrideImage={overrideImage}
        onOverrideConsumed={() => setOverrideImage(null)}
      />
      <div>
        {title}
        <div className="mt-3 text-xl text-glaze">{formatPriceTND(priceTND)}</div>
        {details}
        <VariantSelector
          variants={variants}
          labels={labels}
          onImageSelect={setOverrideImage}
          onPriceSelect={(selected) => setPriceTND(selected ?? basePriceTND)}
        />
        <div className="mt-8">
          <AddToCart
            itemType={addToCart.itemType}
            id={addToCart.id}
            slug={addToCart.slug}
            name={addToCart.name}
            priceTND={priceTND}
            image={addToCart.image}
            maxStock={addToCart.maxStock}
            labels={addToCart.labels}
          />
        </div>
      </div>
    </div>
  )
}
