'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ImageRef } from '@/lib/media'

export default function Gallery({ images, altFallback }: { images: ImageRef[]; altFallback: string }) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    // Tasteful placeholder — same soft glaze tone the catalog cards use when a
    // product has no image at all.
    return <div aria-hidden className="aspect-square w-full rounded-2xl bg-surface" />
  }

  const active = images[index]

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setIndex((i) => Math.min(images.length - 1, i + 1))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
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
              onClick={() => setIndex(i)}
              aria-label={`${altFallback} ${i + 1}/${images.length}`}
              aria-current={i === index}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors motion-reduce:transition-none ${
                i === index ? 'border-glaze' : 'border-transparent'
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
