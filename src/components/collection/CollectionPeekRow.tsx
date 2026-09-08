'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import type { CollectionCardData } from '@/lib/queries'

// One category's collections as a "stack": the active card pops to the front
// at full size; its two neighbors sit BEHIND it (lower z-index, scaled down,
// dimmed, offset just enough for a sliver to peek out on each side) rather
// than beside it in a row. Moving to a neighbor pops IT to the front and the
// previously-active card settles back to a side, tucked behind — both happen
// at once as one continuous transform/opacity/z transition, no crossfade cut.
// Only the active card (front, top of the stack) and its immediate two
// neighbors are ever rendered — "the other two hiding behind it".
//
// Not the old CollectionCarousel's full-bleed pinned/scroll-jacking hero band
// — this is a normal, repeatable page section (there's one of these per
// category on /collection; stacking several scroll-hijacking carousels down
// one page is exactly the jank/fighting-itself pattern that carousel was
// right to avoid for a single hero moment but wrong for here).
//
// Arrows are physically fixed left=previous / right=next regardless of site
// direction — same call the old CollectionCarousel made and documented:
// they're spatial controls, not text, so /ar plays the same deck, same order,
// arrows in the same physical spots, stack order unmirrored.
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
  const count = collections.length

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
    // Only the ACTIVE (front) card actually navigates on a plain click —
    // clicking a card peeking from behind pops it to the front instead. It's
    // still a real <Link> with a real href even while tucked behind, though,
    // so ctrl/cmd/middle-click still opens the right destination straight away.
    if (i !== index) {
      event.preventDefault()
      goTo(i)
    }
  }

  if (count === 0) return null

  // Shortest signed distance from `index`, wrapping around the deck (so
  // stepping "next" past the last card approaches the first from the right,
  // not by yanking it all the way across from the far left).
  function wrappedDelta(i: number) {
    let d = i - index
    if (d > count / 2) d -= count
    if (d < -count / 2) d += count
    return d
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={collections[index]?.title}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex items-center justify-center gap-3 px-4 py-8 sm:gap-6"
    >
      {count > 1 && (
        <button
          type="button"
          onClick={prev}
          aria-label={labels.previous}
          className="z-40 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <div className="relative aspect-[3/2] w-[80vw] max-w-[560px] sm:w-[60vw] md:w-[48vw] lg:w-[40vw]">
        {collections.map((collection, i) => {
          const delta = wrappedDelta(i)
          // Window: only the front card and its immediate two neighbors are
          // ever rendered — anything farther is fully behind the stack, no
          // point paying for it in the DOM.
          if (Math.abs(delta) > 1) return null

          const active = delta === 0
          const image = collection.images[0]
          const textColor = collection.overlayStyle === 'light' ? 'text-paper' : 'text-ink'
          const scrim =
            collection.overlayStyle === 'light'
              ? 'linear-gradient(to top, rgba(42,38,32,0.72) 0%, rgba(42,38,32,0) 55%)'
              : 'linear-gradient(to top, rgba(243,237,226,0.8) 0%, rgba(243,237,226,0) 55%)'

          // Neighbors sit mostly BEHIND the front card (small % offset, lower
          // scale/opacity/z) rather than fully beside it — only a sliver
          // peeks out past the front card's own edge on each side.
          const translatePercent = active ? 0 : delta > 0 ? 30 : -30
          const scale = active ? 1 : 0.88
          const opacity = active ? 1 : 0.55
          const zIndex = active ? 30 : 20

          return (
            <Link
              key={collection.id}
              href={paths.sousCategorie(locale, collection.sousCategorieSlug)}
              onClick={(e) => handleCardClick(e, i)}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              style={{
                transform: `translateX(${translatePercent}%) scale(${scale})`,
                zIndex,
                opacity,
              }}
              className={`group absolute inset-0 block overflow-hidden rounded-2xl bg-surface shadow-sm transition-[transform,opacity,box-shadow] duration-500 ease-out motion-reduce:transition-none ${
                active ? 'shadow-[0_28px_55px_-18px_rgba(42,38,32,0.4)]' : 'hover:opacity-75'
              }`}
            >
              {image && (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 80vw"
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
          )
        })}
      </div>

      {count > 1 && (
        <button
          type="button"
          onClick={next}
          aria-label={labels.next}
          className="z-40 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none"
        >
          <ChevronIcon direction="right" />
        </button>
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
