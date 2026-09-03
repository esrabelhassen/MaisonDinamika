'use client'

import { useCallback, useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import Image from 'next/image'
import type { CollectionBandData } from '@/lib/queries'

// One slide per collection (its first image + its title), auto-advancing on a
// timer and steerable with the left/right arrows or the dots. Replaces the old
// per-collection marquee — that showed every image of ONE collection scrolling
// past; this shows one photo of EVERY collection, cycling between them.
const AUTO_ADVANCE_MS = 6000

function usePrefersReducedMotion() {
  // Lazy initializer so a reduced-motion visitor never gets a one-frame flash of
  // the auto-advance timer starting before their preference is read (same
  // reasoning as the old CollectionBand hook this is ported from).
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export default function CollectionCarousel({
  collections,
  labels,
}: {
  collections: CollectionBandData[]
  labels: { previous: string; next: string }
}) {
  const count = collections.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count])
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])
  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])

  // Re-armed on every index change (auto or manual) so clicking an arrow doesn't
  // get immediately overridden by a tick that was already half-elapsed — every
  // advance, whoever caused it, buys a full fresh interval before the next one.
  useEffect(() => {
    if (count < 2 || reducedMotion || paused) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS)
    return () => clearTimeout(id)
  }, [count, reducedMotion, paused, index])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      prev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    }
  }

  if (count === 0) return null

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={collections[index]?.title}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative h-[280px] w-full overflow-hidden sm:h-[360px] md:h-[55vh] md:max-h-[620px] lg:h-[65vh] lg:max-h-[760px]"
    >
      {collections.map((collection, i) => {
        const image = collection.images[0]
        return (
          <div
            key={collection.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
            />
            <TitleOverlay title={collection.title} overlayStyle={collection.overlayStyle} />
          </div>
        )
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={labels.previous}
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-glaze hover:text-paper hover:shadow-[0_10px_28px_-12px_rgba(94,115,134,0.5)] motion-reduce:transition-none"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={labels.next}
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-glaze hover:text-paper hover:shadow-[0_10px_28px_-12px_rgba(94,115,134,0.5)] motion-reduce:transition-none"
          >
            <ChevronIcon direction="right" />
          </button>

          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
            {collections.map((collection, i) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={collection.title}
                aria-current={i === index}
                className={`h-1.5 w-1.5 rounded-full transition-colors motion-reduce:transition-none ${
                  i === index ? 'bg-paper' : 'bg-paper/40 hover:bg-paper/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TitleOverlay({ title, overlayStyle }: { title: string; overlayStyle: 'light' | 'dark' }) {
  const textColor = overlayStyle === 'light' ? 'text-paper' : 'text-ink'
  // Radial, not a flat wash — falls to fully transparent well before the slide's
  // edges, so the photo (not the scrim) stays the visual centerpiece. The scrim
  // colour is the OPPOSITE of the text colour: light (paper) text needs a dark
  // (ink) scrim behind it to read, and dark (ink) text needs a light (paper) one.
  // rgba values are the current `ink`/`paper` token hex (#2A2620 / #F3EDE2).
  const scrim =
    overlayStyle === 'light'
      ? 'radial-gradient(ellipse 65% 55% at center, rgba(42,38,32,0.5) 0%, rgba(42,38,32,0) 72%)'
      : 'radial-gradient(ellipse 65% 55% at center, rgba(243,237,226,0.6) 0%, rgba(243,237,226,0) 72%)'

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
      <div aria-hidden className="absolute inset-0" style={{ background: scrim }} />
      <h2
        className={`relative text-center font-display text-3xl tracking-[0.15em] sm:text-5xl lg:text-6xl ${textColor}`}
      >
        {title}
      </h2>
    </div>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}
