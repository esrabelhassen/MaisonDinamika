'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ImageRef } from '@/lib/media'

export default function Gallery({
  images,
  altFallback,
  overrideImage = null,
  onOverrideConsumed,
}: {
  images: ImageRef[]
  altFallback: string
  /** Set by a parent that also renders a variant selector (Pack/Dimension/
   * Couleur, see VariantSelector.tsx + ProductDetailLayout.tsx): shown instead
   * of `images[index]` when present. Deliberately a whole ImageRef rather than
   * an index into `images` — the option's photo doesn't have to already be one
   * of the product's gallery images, so there's no index to look up. Omit both
   * this and `onOverrideConsumed` for a plain, self-contained gallery (e.g. the
   * à-propos page) — behaves exactly as before. */
  overrideImage?: ImageRef | null
  /** Called when the visitor manually browses (thumbnail click or arrow key) —
   * lets the parent clear its override so manual browsing isn't immediately
   * fought by the still-active variant selection. */
  onOverrideConsumed?: () => void
}) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    // Tasteful placeholder — same soft glaze tone the catalog cards use when a
    // product has no image at all.
    return <div aria-hidden className="aspect-square w-full rounded-2xl bg-surface" />
  }

  const active = overrideImage ?? images[index]

  function goTo(next: number | ((prev: number) => number)) {
    setIndex(next)
    onOverrideConsumed?.()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo((i) => Math.min(images.length - 1, i + 1))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo((i) => Math.max(0, i - 1))
    }
  }

  return (
    <div>
      <div
        role="group"
        aria-label={altFallback}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface"
      >
        <Image
          src={active.url}
          alt={active.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${altFallback} ${i + 1}/${images.length}`}
              // Matched by URL, not by index === i: while a variant's override
              // image is showing, it may or may not coincide with one of these
              // thumbnails — this highlights it correctly either way, with no
              // separate tracking needed for the override case.
              aria-current={img.url === active.url}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors motion-reduce:transition-none ${
                img.url === active.url ? 'border-glaze' : 'border-transparent'
              }`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
