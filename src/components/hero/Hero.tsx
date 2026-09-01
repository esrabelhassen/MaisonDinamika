'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import type { HeroSceneHandle } from './heroScene'

export type HeroProps = {
  locale: Locale
  eyebrow?: string | null
  headline?: string | null
  sub?: string | null
  ctaLabel?: string | null
  ctaLink?: string | null
}

/** "Everything settles into *place*" -> […, <em>place</em>] — no schema change, the
 * admin just wraps the accent word in asterisks. */
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

export default function Hero({ locale, eyebrow, headline, sub, ctaLabel, ctaLink }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const [contextLost, setContextLost] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    // Guards the async setup below against React StrictMode's dev-only double-invoke:
    // the effect can be torn down (cleanup run) before `import('three')` resolves, in
    // which case this flag stops the stale continuation from building a second
    // renderer on the same canvas.
    let torndown = false
    let scene: HeroSceneHandle | null = null
    let observer: IntersectionObserver | null = null
    let isIntersecting = true
    let cosmeticRaf = 0
    let visibilityHandler: (() => void) | null = null

    function getProgress() {
      const rect = wrap!.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      return Math.min(Math.max(-rect.top / total, 0), 1)
    }

    // The hero copy is static — it never moves or rescales with scroll (only the
    // 3D scene behind it is scroll-driven). The "Scroll" hint is the one thing
    // that still reacts to scroll, fading out over the first slice of it, via a
    // direct style write (not React state) so this runs every animation frame
    // without triggering re-renders.
    function updateHintStyle(raw: number) {
      const hint = hintRef.current
      if (hint) {
        const t = Math.min(Math.max(raw / 0.15, 0), 1)
        hint.style.opacity = String(1 - t)
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion && hintRef.current) {
      hintRef.current.style.display = 'none'
    }

    async function init() {
      const [THREE, { createHeroScene }] = await Promise.all([import('three'), import('./heroScene')])
      if (torndown || !canvas) return

      scene = await createHeroScene(THREE, {
        canvas,
        getProgress,
        onContextLost: () => setContextLost(true),
      })
      if (torndown) {
        scene.dispose()
        return
      }

      if (prefersReducedMotion) {
        // Static resolved stack — the end.p/end.r/endScale values already in the
        // spec, rendered once, no rAF loop at all.
        scene.renderAtProgress(1)
        return
      }

      // Piggyback the hint's fade on the same cadence as the 3D loop by polling
      // via a lightweight rAF here too — kept separate from heroScene's own loop
      // so the (framework-agnostic) scene module never has to know about our DOM
      // copy elements.
      function cosmeticLoop() {
        updateHintStyle(getProgress())
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
  }, [])

  return (
    <div ref={wrapRef} data-hero className="relative -mt-20 h-[260vh] md:h-[360vh]">
      {/* ONE shared `sticky top-0 h-screen` box holding the canvas AND the copy,
          not two independent sticky siblings. `position: sticky` still occupies
          its box in normal flow (unlike `fixed`/`absolute`, which don't) — so an
          earlier version of this fix that made the canvas its own top-level
          `sticky h-screen` sibling ended up adding a full extra viewport height
          to this wrapper's flow, in front of the copy's own sticky block. That
          pushed the copy's natural flow position down by that same amount,
          delaying exactly when ITS sticky offset engages — which is what made
          the text visibly scroll with the page instead of staying put. Nesting
          both inside one sticky box (canvas absolutely filling it, copy laid
          out normally inside it) avoids adding any extra flow height, so this
          still un-sticks and scrolls away — canvas AND copy together — once the
          wrapper's own bottom edge is reached (fixing the original bug: the
          canvas used to be `fixed`, with nothing to stop it painting over
          everything below the hero, including the footer). */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" />

        {contextLost && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-glaze-mid via-glaze-deep to-ink"
          >
            <div className="h-40 w-40 rounded-full bg-[radial-gradient(circle_at_45%_40%,#C8CCD5,#77899E_55%,#363F49)] opacity-70 sm:h-56 sm:w-56" />
          </div>
        )}

        <div className="relative z-[2] grid h-full place-items-center">
          <div className="px-6 text-center">
            {eyebrow && (
              <div className="mb-4 text-base uppercase tracking-[0.28em] text-glaze sm:text-lg">{eyebrow}</div>
            )}
            {headline && (
              <h1 className="font-display text-[clamp(30px,5vw,60px)] font-normal leading-[0.98] tracking-tight text-ink">
                {renderHeadline(headline)}
              </h1>
            )}
            {sub && (
              <p className="mx-auto mt-5 max-w-[34ch] text-lg leading-relaxed text-muted sm:text-xl">{sub}</p>
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
      </div>

      {/* Fades to opacity 0 within the first 15% of scroll (see updateHintStyle),
          long before the hero's own bounds end, so it's never visibly bleeding
          past it like the canvas was — but it's still a `fixed` element sitting
          there for the rest of the page regardless, so `pointer-events-none`
          keeps its (invisible) hit area from ever intercepting a click on
          whatever's really underneath it further down the page. */}
      <div
        ref={hintRef}
        aria-hidden
        className="pointer-events-none fixed bottom-8 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted motion-reduce:hidden"
      >
        <span>Scroll</span>
        <span className="relative h-8 w-px overflow-hidden bg-black/10">
          <span className="absolute inset-x-0 -top-8 h-8 animate-[hero-scroll-hint_2s_ease-in-out_infinite] bg-glaze" />
        </span>
      </div>
    </div>
  )
}
