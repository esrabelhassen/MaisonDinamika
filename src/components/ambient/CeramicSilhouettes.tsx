'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  CERAMIC_VIEWBOX,
  bowlOutlinePath,
  bowlProfileLinePath,
  plateOutlinePath,
} from '@/lib/ceramicPaths'

// Site-wide ambient layer #2: faint hairline outline drawings of the brand's own
// plate/bowl forms (see src/lib/ceramicPaths.ts — copied profile NUMBERS only,
// this file never imports from or references src/components/hero/*). Mounted
// once in the (frontend) root layout, right after DreamyBackground, so it sits
// ABOVE the blooms and BELOW page content everywhere on the storefront.
//
// HERO EXCLUSION (constraint #2): on the home route the hero's transparent
// canvas is pinned (`position: sticky`) for the whole 260–360vh scroll range —
// while the outer `[data-hero]` wrapper is intersecting the viewport at all,
// the sticky canvas is filling the screen, so drawn dishes there would sit
// directly over the real ones. Rather than hardcode that scroll distance (which
// would silently drift out of sync if the hero's own height ever changes), this
// watches the `[data-hero]` element itself with an IntersectionObserver — the
// same technique HeaderClient.tsx already uses for its own "are we still over
// the hero" check — and only fades this whole layer in once `[data-hero]` has
// scrolled fully out of view. It's a read of a public DOM marker the hero
// deliberately exposes, not an import of or dependency on the rig's internals.
// On every other route there's no `[data-hero]` in the tree at all, so the
// layer is simply visible immediately, full-time.
const HOME_ROUTE = /^\/[a-z]{2}\/?$/

/** True once it's safe to show the layer: immediately on any non-home route, or
 * once `[data-hero]` has fully left the viewport on the home route. */
function usePastHero(pathname: string | null): boolean {
  const onHome = HOME_ROUTE.test(pathname ?? '')
  const [pastHero, setPastHero] = useState(!onHome)

  useEffect(() => {
    if (!onHome) {
      setPastHero(true)
      return
    }
    const heroEl = document.querySelector('[data-hero]')
    if (!heroEl) {
      // No hero mounted (shouldn't happen on the home route, but never block
      // the layer forever over a selector mismatch).
      setPastHero(true)
      return
    }
    setPastHero(false)
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(heroEl)
    return () => observer.disconnect()
  }, [onHome])

  return pastHero
}

// Stroke opacity is the one dial to tune if this and DreamyBackground ever feel
// like too much together — see the component-level comment above.
const STROKE_OPACITY = 0.06

type Shape = {
  path: string
  /** Tailwind size classes — square, so the pre-centered viewBox isn't stretched. */
  size: string
  position: string
  animation: string
  /** Hide on the smallest screens to keep the layer light there. */
  hideOnMobile?: boolean
}

const SHAPES: Shape[] = [
  {
    path: bowlOutlinePath,
    size: 'h-72 w-72 sm:h-[26rem] sm:w-[26rem]',
    position: '-left-16 -top-10',
    animation: 'animate-[ceramic-drift-1_84s_ease-in-out_infinite]',
  },
  {
    path: plateOutlinePath,
    size: 'h-56 w-56 sm:h-80 sm:w-80',
    position: '-right-12 bottom-16',
    animation: 'animate-[ceramic-drift-2_101s_ease-in-out_infinite]',
  },
  {
    path: bowlProfileLinePath,
    size: 'h-40 w-40 sm:h-56 sm:w-56',
    position: 'right-10 top-1/4',
    animation: 'animate-[ceramic-drift-3_73s_ease-in-out_infinite]',
    hideOnMobile: true,
  },
  {
    path: bowlOutlinePath,
    size: 'h-44 w-44 sm:h-64 sm:w-64',
    position: '-left-10 bottom-0',
    animation: 'animate-[ceramic-drift-4_118s_ease-in-out_infinite]',
    hideOnMobile: true,
  },
  {
    path: plateOutlinePath,
    size: 'h-36 w-36 sm:h-52 sm:w-52',
    position: 'right-1/4 -top-8',
    animation: 'animate-[ceramic-drift-5_95s_ease-in-out_infinite]',
  },
]

export default function CeramicSilhouettes() {
  const pathname = usePathname()
  const pastHero = usePastHero(pathname)

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-[5] overflow-hidden text-ink transition-opacity duration-700 motion-reduce:transition-none ${
        pastHero ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {SHAPES.map((shape, i) => (
        <svg
          key={i}
          viewBox={CERAMIC_VIEWBOX}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          className={`absolute ${shape.size} ${shape.position} ${shape.animation} motion-reduce:animate-none ${
            shape.hideOnMobile ? 'hidden sm:block' : ''
          }`}
          style={{ opacity: STROKE_OPACITY }}
        >
          <path d={shape.path} vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </div>
  )
}
