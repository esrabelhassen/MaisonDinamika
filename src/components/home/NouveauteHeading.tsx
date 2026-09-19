'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Same SSR-safe pattern as RoomTour.tsx's identical hook: falls back to a
// plain effect on the server (useLayoutEffect there just warns and no-ops).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// The one heading on the storefront asked to feel overtly premium/animated
// rather than quietly restrained (contrast with DreamyBackground's ambient-only
// brief) — two independent movements, both gated the same way every other
// motion effect in this codebase is:
//  1. A one-time scroll reveal — fades + rises in, with a thin accent line
//     drawing in beneath it — the first time the heading enters the viewport.
//     Never re-triggers scrolling back up/down (the IntersectionObserver
//     disconnects itself after firing once).
//  2. A continuous, slow gold "sheen" sweeping through the letters (see
//     globals.css's nouveaute-shimmer keyframes) — resting at ink-plain for
//     most of each cycle, so it reads as an occasional flash of light rather
//     than a constant shimmer effect.
// prefers-reduced-motion swaps to a fully static heading (no gradient, no
// reveal animation, just shown) rather than freezing either mid-motion.
//
// The sheen is a SEPARATE `aria-hidden` layer stacked exactly on top of a
// real, solid `text-ink` heading — not a color swap on the actual text. A
// heading's readable color has to clear AA against `paper` at every moment of
// the animation, and the shimmer's brighter stops (glaze-light/-mid) don't:
// checked by hand (sRGB relative luminance, as elsewhere in this codebase),
// glaze-light on paper is ~1.08:1 and glaze-mid ~2.76:1 — both fail even the
// 3:1 large-text floor. Keeping the real text solid ink (~12.3:1, untouched
// by the animation) and layering a semi-transparent gold gradient on top via
// `mix-blend-overlay`, clipped to the same glyphs, gets the "light passing
// over the letters" look without the legible text ever actually being that
// pale — the overlay only brightens already-solid dark letters, it never
// substitutes for them.
export default function NouveauteHeading({ heading }: { heading: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReducedMotion(true)
      setRevealed(true) // nothing to reveal toward — just show it
    }
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
      if (event.matches) setRevealed(true)
    }
    mq.addEventListener('change', handler)

    let observer: IntersectionObserver | null = null
    if (!mq.matches && ref.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer?.disconnect()
          }
        },
        { threshold: 0.3 },
      )
      observer.observe(ref.current)
    }

    return () => {
      mq.removeEventListener('change', handler)
      observer?.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {reducedMotion ? (
        <h2 className="font-display text-3xl text-ink sm:text-4xl">{heading}</h2>
      ) : (
        <div className="relative inline-block">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{heading}</h2>
          {/* Decorative sheen layer — see the component doc comment above for
              why this is a separate overlay rather than an animated text color.
              A <span>, not a second heading: aria-hidden already keeps it out
              of the accessibility tree, but there's no reason to even have a
              second h2-level node in the DOM for something purely visual. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 block animate-[nouveaute-shimmer_6s_ease-in-out_infinite] bg-[linear-gradient(100deg,transparent_30%,rgba(237,224,184,0.9)_45%,rgba(168,135,74,0.95)_50%,rgba(237,224,184,0.9)_55%,transparent_70%)] bg-[length:250%_100%] bg-clip-text font-display text-3xl text-transparent mix-blend-overlay [-webkit-background-clip:text] sm:text-4xl"
          >
            {heading}
          </span>
        </div>
      )}
      <span
        aria-hidden
        className={`mt-3 block h-px w-16 origin-left bg-glaze-deep transition-transform duration-1000 ease-out motion-reduce:transition-none ${
          revealed ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
    </div>
  )
}
