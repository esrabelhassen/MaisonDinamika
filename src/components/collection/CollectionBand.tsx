'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { BandImage } from '@/lib/media'

// Every image carries a trailing margin (not a container `gap`) so the "one repeat
// unit" width computed below — sum(image widths) + images.length * GAP_PX — is
// EXACTLY half the duplicated row's real width. That's what makes translateX(-50%)
// land precisely on a repeat boundary with no jump: a container `gap` would only
// apply *between* items, leaving the seam between the two copies one gap narrower
// than every other gap, which is exactly the kind of half-pixel jump this avoids.
const GAP_PX = 16 // Tailwind `me-4`
const SPEED_PX_PER_SEC = 70 // constant scroll speed — duration scales with content, not the reverse
const MIN_LOOP_RATIO = 1.15 // a repeat must clear the viewport by this much to loop without stutter

function usePrefersReducedMotion() {
  // Lazy initializer: reads the real preference synchronously on the first CLIENT
  // render (SSR has no window, so the server-rendered markup always assumes
  // motion-ok, same as any other client-only preference). This runs before the
  // loop-eligibility useLayoutEffect below ever commits a `loop: true` state, so a
  // reduced-motion visitor never gets a one-frame flash of the animated marquee
  // before it reads their preference — the alternative (deriving this via a plain
  // useEffect) fires AFTER layout effects and would have raced canLoop's earlier
  // commit exactly like that.
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

export default function CollectionBand({
  title,
  overlayStyle,
  images,
  dir,
}: {
  title: string
  overlayStyle: 'light' | 'dark'
  images: BandImage[]
  dir: 'ltr' | 'rtl'
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [canLoop, setCanLoop] = useState(false)
  const [duration, setDuration] = useState(30)
  const [paused, setPaused] = useState(false)

  // Measures whether one repeat of the images is wide enough to loop cleanly. Runs
  // in a layout effect (before paint) so a loop-eligible band never visibly flashes
  // the static single-row fallback first — and the calc uses each image's known
  // width/height (from Payload), not anything that needs to wait for image load.
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el || images.length < 2) {
      setCanLoop(false)
      return
    }

    function measure() {
      const height = el!.clientHeight
      const viewportWidth = el!.clientWidth
      if (!height || !viewportWidth) return
      const unitWidth =
        images.reduce((sum, img) => sum + (height * img.width) / img.height, 0) + images.length * GAP_PX
      const eligible = unitWidth > viewportWidth * MIN_LOOP_RATIO
      setCanLoop(eligible)
      if (eligible) setDuration(Math.max(unitWidth / SPEED_PX_PER_SEC, 8))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [images])

  const loop = canLoop && !reducedMotion
  const track = loop ? [...images, ...images] : images

  return (
    <div
      ref={viewportRef}
      data-loop={loop}
      data-can-loop={canLoop}
      tabIndex={0}
      role="group"
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ ['--marquee-dir' as string]: dir === 'rtl' ? 1 : -1 }}
      className={`relative w-full h-[280px] sm:h-[360px] md:h-[55vh] md:max-h-[620px] lg:h-[65vh] lg:max-h-[760px] ${
        loop ? 'overflow-hidden' : 'overflow-x-auto overscroll-x-contain'
      }`}
    >
      <div
        className="flex h-full w-max items-stretch"
        style={
          loop
            ? {
                animationName: 'collection-marquee',
                animationDuration: `${duration}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationPlayState: paused ? 'paused' : 'running',
              }
            : undefined
        }
      >
        {track.map((img, i) => (
          <div
            key={i}
            className="relative h-full shrink-0 me-4 overflow-hidden rounded-2xl"
            style={{ aspectRatio: `${img.width} / ${img.height}` }}
            aria-hidden={i >= images.length ? true : undefined}
          >
            <Image
              src={img.url}
              alt={i < images.length ? img.alt : ''}
              fill
              sizes="(max-width: 640px) 60vw, 32vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <TitleOverlay title={title} overlayStyle={overlayStyle} />
    </div>
  )
}

function TitleOverlay({ title, overlayStyle }: { title: string; overlayStyle: 'light' | 'dark' }) {
  const textColor = overlayStyle === 'light' ? 'text-paper' : 'text-ink'
  // Radial, not a flat wash — falls to fully transparent well before the band's
  // edges, so the images (not the scrim) stay the visual centerpiece. The scrim
  // colour is the OPPOSITE of the text colour: light (near-white) text needs a
  // dark scrim behind it to read, and dark (ink) text needs a light one.
  const scrim =
    overlayStyle === 'light'
      ? 'radial-gradient(ellipse 65% 55% at center, rgba(32,36,42,0.5) 0%, rgba(32,36,42,0) 72%)'
      : 'radial-gradient(ellipse 65% 55% at center, rgba(244,242,236,0.6) 0%, rgba(244,242,236,0) 72%)'

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
