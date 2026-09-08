'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import type { CollectionCardData } from '@/lib/queries'

// One category's collections as a "peek" row: the active card sits centered
// and at full size, its neighbors are cropped at the viewport edge (visibly
// half-there, not fully hidden) and dimmed/scaled down — the classic
// coverflow-ish "pop forward" look. Not the old CollectionCarousel's
// full-bleed pinned/scroll-jacking hero band — this is a normal, repeatable
// page section (there's one of these per category on /collection, and
// stacking several scroll-hijacking carousels down one page is exactly the
// jank/fighting-itself pattern that carousel was right to avoid for a single
// hero moment but wrong for here).
//
// Arrows are physically fixed left=previous / right=next regardless of site
// direction — same call as the old CollectionCarousel made and documented:
// they're spatial controls, not text, so /ar plays the same deck, same order,
// arrows in the same physical spots.
export default function CollectionPeekRow({
  locale,
  collections,
  labels,
}: {
  locale: Locale
  collections: CollectionCardData[]
  labels: { previous: string; next: string }
}) {
  const [index, setIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const count = collections.length

  // Measures the ACTUAL rendered card width/position (via refs), rather than
  // trying to keep a duplicate width value in JS in sync with the responsive
  // Tailwind width classes on each card across every breakpoint — same
  // measure-real-layout approach the old collection band used for its own
  // marquee math (ResizeObserver, not a guessed formula).
  useLayoutEffect(() => {
    function measure() {
      const viewport = viewportRef.current
      const card = cardRefs.current[index]
      if (!viewport || !card) return
      const desired = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2
      setOffset(desired)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (viewportRef.current) ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [index, count])

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const next = useCallback(() => goTo(index + 1), [goTo, index])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      prev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    }
  }

  function handleCardClick(event: MouseEvent<HTMLAnchorElement>, i: number) {
    // Only the ACTIVE card actually navigates on a plain click — clicking a
    // peeking neighbor brings it to center instead. It's still a real <Link>
    // with a real href even while peeking, though, so ctrl/cmd/middle-click
    // still opens the right destination straight away.
    if (i !== index) {
      event.preventDefault()
      goTo(i)
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
      className="relative py-6"
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div
          className="flex items-center gap-4 transition-transform duration-500 ease-out motion-reduce:transition-none sm:gap-6"
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {collections.map((collection, i) => {
            const active = i === index
            const image = collection.images[0]
            const textColor = collection.overlayStyle === 'light' ? 'text-paper' : 'text-ink'
            const scrim =
              collection.overlayStyle === 'light'
                ? 'linear-gradient(to top, rgba(42,38,32,0.72) 0%, rgba(42,38,32,0) 55%)'
                : 'linear-gradient(to top, rgba(243,237,226,0.8) 0%, rgba(243,237,226,0) 55%)'
            return (
              <div
                key={collection.id}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className="w-[74vw] max-w-[560px] shrink-0 sm:w-[52vw] md:w-[40vw] lg:w-[32vw]"
              >
                <Link
                  href={paths.sousCategorie(locale, collection.sousCategorieSlug)}
                  onClick={(e) => handleCardClick(e, i)}
                  aria-hidden={!active}
                  tabIndex={active ? 0 : -1}
                  className={`group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-surface shadow-sm transition-[transform,opacity,box-shadow] duration-500 ease-out motion-reduce:transition-none ${
                    active
                      ? 'scale-100 opacity-100 shadow-[0_24px_50px_-20px_rgba(42,38,32,0.35)]'
                      : 'scale-[0.86] opacity-50 hover:opacity-70'
                  }`}
                >
                  {image && (
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 32vw, (min-width: 640px) 52vw, 74vw"
                      className="object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
                    />
                  )}
                  <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: scrim }} />
                  <span
                    className={`pointer-events-none absolute inset-x-0 bottom-0 px-5 py-5 font-display text-xl tracking-wide ${textColor}`}
                  >
                    {collection.title}
                  </span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={labels.previous}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none sm:left-4"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={labels.next}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none sm:right-4"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}
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
