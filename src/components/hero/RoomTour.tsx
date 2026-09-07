'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import type { RoomTourSceneHandle } from './roomTourScene'
import { IMAGE_HEIGHT, IMAGE_WIDTH, STOPS, computeCameraState } from './roomTourCamera'
import type { CameraState } from './roomTourCamera'

export type RoomTourProps = {
  locale: Locale
  eyebrow?: string | null
  headline?: string | null
  sub?: string | null
  ctaLabel?: string | null
  ctaLink?: string | null
}

const COLOR_URL = '/hero-tour/room.jpeg'
const DEPTH_URL = '/hero-tour/room-depth.png'

// Small, pure copy helpers duplicated from Hero.tsx rather than imported from
// it — this file must never depend on src/components/hero/Hero.tsx or
// heroScene.ts (the dish hero stays untouched, see the home page for the
// one-line toggle back to it).
function renderHeadline(headline: string) {
  return headline.split(/\*([^*]+)\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} className="italic text-glaze">
        {part}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function resolveCtaHref(locale: Locale, ctaLink: string) {
  if (/^https?:\/\//.test(ctaLink)) return ctaLink
  if (ctaLink.startsWith(`/${locale}`)) return ctaLink
  return `/${locale}${ctaLink.startsWith('/') ? '' : '/'}${ctaLink}`
}

// `reducedMotion` picks between two STRUCTURALLY different trees (the pinned
// canvas stage vs. StaticRoomTour's plain <section>) — unlike DreamyBackground's
// identical hook (safe there because only classNames differ), a lazy useState
// initializer here would make the client's first render disagree with the
// server's every time, since SSR has no `window` and always assumes motion-ok.
// useLayoutEffect instead: it still flips state before the browser paints (no
// visible flash of the wrong branch), but only AFTER the client's first render
// has already matched the server's, so hydration never sees a mismatch — and
// because the flip happens before any passive effect for that commit runs, the
// main effect below never starts fetching three.js/textures for a
// reduced-motion visitor in the first place. Falls back to useEffect during
// SSR (useLayoutEffect on the server just warns and no-ops).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

/** Writes the CSS-fallback pan/zoom/tilt straight to the element's style each
 * frame (no depth map here — see the module doc comment on why). background-
 * position's percentage semantics already do exactly the "look-at point"
 * interpolation we want once background-size is larger than the container, so
 * this is a `cover` fit scaled up by `state.zoom`, then panned by percentage. */
function applyFallbackStyle(el: HTMLDivElement, state: CameraState) {
  const containerW = el.clientWidth || window.innerWidth
  const containerH = el.clientHeight || window.innerHeight
  const coverScale = Math.max(containerW / IMAGE_WIDTH, containerH / IMAGE_HEIGHT)
  const displayScale = coverScale * state.zoom
  el.style.backgroundSize = `${IMAGE_WIDTH * displayScale}px ${IMAGE_HEIGHT * displayScale}px`
  el.style.backgroundPosition = `${state.center.x * 100}% ${state.center.y * 100}%`
  const nudgePx = 5
  const tiltDeg = (state.tilt * 180) / Math.PI
  el.style.transform = `translate(${state.nudge.x * nudgePx}px, ${state.nudge.y * nudgePx}px) rotate(${tiltDeg}deg)`
}

export default function RoomTour({ locale, eyebrow, headline, sub, ctaLabel, ctaLink }: RoomTourProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const captionRefs = useRef<(HTMLDivElement | null)[]>([])

  const [webglFailed, setWebglFailed] = useState(false)
  // Starts `false` — matches what SSR renders, since it has no `window` — and
  // is only ever flipped client-side via the layout effect below. See
  // useIsomorphicLayoutEffect's comment for why this can't be a lazy
  // useState initializer here the way DreamyBackground's is.
  const [reducedMotion, setReducedMotion] = useState(false)

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setReducedMotion(true)
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (reducedMotion) return // the static branch below needs no rAF/canvas/observer at all
    const wrap = wrapRef.current
    if (!wrap) return

    // Same StrictMode dev-double-invoke guard as Hero.tsx.
    let torndown = false
    let scene: RoomTourSceneHandle | null = null
    let observer: IntersectionObserver | null = null
    let isIntersecting = true
    let cosmeticRaf = 0
    let visibilityHandler: (() => void) | null = null
    // Plain local flag, NOT the `webglFailed` React state — this closure is
    // created once and never sees state updates that happen after it runs, so
    // the frame loop below must read a variable it can actually mutate itself.
    let usingWebGL = false

    function getProgress() {
      const rect = wrap!.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      return Math.min(Math.max(-rect.top / total, 0), 1)
    }

    function updateCosmetics(raw: number) {
      const aspect = window.innerWidth / window.innerHeight
      const state = computeCameraState(raw, aspect, performance.now())

      STOPS.forEach((_, i) => {
        const el = captionRefs.current[i]
        if (el) el.style.opacity = String(state.captionOpacity[i])
      })

      const hint = hintRef.current
      if (hint) {
        const t = Math.min(Math.max(raw / 0.15, 0), 1)
        hint.style.opacity = String(1 - t)
      }

      if (!usingWebGL) {
        const fb = fallbackRef.current
        if (fb) applyFallbackStyle(fb, state)
      }
    }

    function cosmeticLoop() {
      updateCosmetics(getProgress())
      cosmeticRaf = requestAnimationFrame(cosmeticLoop)
    }

    function ensureRunning() {
      if (!isIntersecting || document.hidden) {
        scene?.stop()
        if (cosmeticRaf) cancelAnimationFrame(cosmeticRaf)
        cosmeticRaf = 0
        return
      }
      scene?.start()
      if (!cosmeticRaf) cosmeticRaf = requestAnimationFrame(cosmeticLoop)
    }

    async function init() {
      if (supportsWebGL()) {
        try {
          const [THREE, { createRoomTourScene }] = await Promise.all([import('three'), import('./roomTourScene')])
          if (torndown) return
          const canvas = canvasRef.current
          if (!canvas) throw new Error('room-tour canvas not mounted')
          scene = await createRoomTourScene(THREE, {
            canvas,
            getProgress,
            onContextLost: () => {
              usingWebGL = false
              setWebglFailed(true)
              scene?.stop()
            },
            colorUrl: COLOR_URL,
            depthUrl: DEPTH_URL,
          })
          if (torndown) {
            scene.dispose()
            return
          }
          usingWebGL = true
        } catch {
          // Texture load failure, GPU/driver rejection, etc. — never leave a
          // blank hero, drop straight to the CSS-only tour.
          usingWebGL = false
          setWebglFailed(true)
        }
      } else {
        usingWebGL = false
        setWebglFailed(true)
      }

      if (torndown) return

      updateCosmetics(getProgress()) // first paint before any scroll/rAF tick

      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting
          ensureRunning()
        },
        { threshold: 0 },
      )
      observer.observe(wrap!)

      visibilityHandler = ensureRunning
      document.addEventListener('visibilitychange', visibilityHandler)
      ensureRunning()
    }

    init()

    return () => {
      torndown = true
      observer?.disconnect()
      if (cosmeticRaf) cancelAnimationFrame(cosmeticRaf)
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
      scene?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  if (reducedMotion) {
    return <StaticRoomTour locale={locale} eyebrow={eyebrow} headline={headline} sub={sub} ctaLabel={ctaLabel} ctaLink={ctaLink} />
  }

  return (
    // Same -mt-20 / sticky / h-[Nvh] shape as Hero.tsx, for the identical
    // reason documented there (one sticky box holding canvas + copy together,
    // so both un-stick and scroll away cleanly once this wrapper's bottom edge
    // is reached — no sticky conflict with Nouveauté below).
    <div ref={wrapRef} data-hero className="relative -mt-20 h-[340vh] md:h-[440vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${webglFailed ? 'hidden' : ''}`}
        />
        {/* CSS-only tour: same pan/zoom/tilt math, no depth map. Always mounted
            (never conditionally rendered) so its ref exists the instant a
            fallback is needed — visibility is toggled by class, not mount. */}
        <div
          ref={fallbackRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-0 bg-no-repeat ${webglFailed ? '' : 'hidden'}`}
          style={{ backgroundImage: `url(${COLOR_URL})` }}
        />

        {/* Dark scrim behind the copy only — the photo keeps panning underneath
            it, so (unlike the dish hero's steadier backdrop) contrast can't
            rely on any one fixed region always being light. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: 'radial-gradient(ellipse 62% 46% at center, rgba(42,38,32,0.4) 0%, rgba(42,38,32,0) 72%)',
          }}
        />

        <div className="relative z-[2] grid h-full place-items-center">
          <div className="px-6 text-center">
            {eyebrow && (
              <div className="mb-4 text-base uppercase tracking-[0.28em] text-paper sm:text-lg">{eyebrow}</div>
            )}
            {headline && (
              <h1 className="font-display text-[clamp(30px,5vw,60px)] font-normal leading-[0.98] tracking-tight text-paper">
                {renderHeadline(headline)}
              </h1>
            )}
            {sub && (
              <p className="mx-auto mt-5 max-w-[34ch] text-lg leading-relaxed text-paper/85 sm:text-xl">{sub}</p>
            )}
            {ctaLabel && ctaLink && (
              <div className="pointer-events-auto mt-7">
                {/^https?:\/\//.test(ctaLink) ? (
                  <a
                    href={ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep motion-reduce:transition-none"
                  >
                    {ctaLabel}
                  </a>
                ) : (
                  <Link
                    href={resolveCtaHref(locale, ctaLink)}
                    className="inline-block rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep motion-reduce:transition-none"
                  >
                    {ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Captions — one per stop, all stacked in the same spot; only the
            active one is ever meaningfully opaque (see computeCameraState's
            captionOpacity windows). A translucent chip rather than bare text
            over the photo, so legibility never depends on what's behind it.
            Each chip centers itself via left-1/2 + -translate-x-1/2, NOT by
            relying on a sized ancestor: a wrapper whose only children are all
            `position: absolute` has no in-flow content to size itself by, so
            it collapses to 0 width — which silently broke this (each chip's
            box shrank to just its own padding, with the nowrap text
            overflowing past it, uncentered) until caught by reading back the
            actual computed layout rect rather than trusting a screenshot. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-24 z-[2] h-11 px-6 sm:bottom-28"
        >
          {STOPS.map((stop, i) => (
            <div
              key={stop.label}
              ref={(el) => {
                captionRefs.current[i] = el
              }}
              // TODO(product-links): once each stop has a real product/category
              // href (see RoomTourStop in roomTourCamera.ts), swap this <div>
              // for a <Link> here and make the chip pointer-events:auto.
              className="absolute left-1/2 top-0 flex h-11 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-paper/90 px-5 text-sm uppercase tracking-[0.14em] text-ink opacity-0 shadow-sm backdrop-blur-sm"
            >
              {stop.label}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={hintRef}
        aria-hidden
        className="pointer-events-none fixed bottom-8 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted"
      >
        <span>Scroll</span>
        <span className="relative h-8 w-px overflow-hidden bg-black/10">
          <span className="absolute inset-x-0 -top-8 h-8 animate-[hero-scroll-hint_2s_ease-in-out_infinite] bg-glaze" />
        </span>
      </div>
    </div>
  )
}

/** prefers-reduced-motion: no pinned stage, no canvas, no rAF — a calm normal-
 * flow section. Hero copy renders as an intro ABOVE the four stops (rather
 * than overlaid on a photo, per the brief's explicit "or as an intro above
 * it") since there's no single backdrop here to guarantee contrast against. */
function StaticRoomTour({ locale, eyebrow, headline, sub, ctaLabel, ctaLink }: RoomTourProps) {
  return (
    <section data-hero className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow && <div className="mb-4 text-base uppercase tracking-[0.28em] text-glaze sm:text-lg">{eyebrow}</div>}
        {headline && (
          <h1 className="font-display text-[clamp(30px,5vw,60px)] font-normal leading-[0.98] tracking-tight text-ink">
            {renderHeadline(headline)}
          </h1>
        )}
        {sub && <p className="mx-auto mt-5 max-w-[34ch] text-lg leading-relaxed text-muted sm:text-xl">{sub}</p>}
        {ctaLabel && ctaLink && (
          <div className="mt-7">
            {/^https?:\/\//.test(ctaLink) ? (
              <a
                href={ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep"
              >
                {ctaLabel}
              </a>
            ) : (
              <Link
                href={resolveCtaHref(locale, ctaLink)}
                className="inline-block rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
        {STOPS.map((stop) => (
          <figure key={stop.label} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
            {/* Plain <img>, not next/image: this is a single static local asset
                outside next.config.ts's images.localPatterns (deliberately
                scoped to /api/media/file/** for Payload-served media only) —
                widening that shared config for one hero asset felt like a
                bigger, separate decision than this task should make silently. */}
            <img
              src={COLOR_URL}
              alt={stop.label}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `${stop.center.x * 100}% ${stop.center.y * 100}%` }}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-5 py-4 font-display text-lg text-paper">
              {stop.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
