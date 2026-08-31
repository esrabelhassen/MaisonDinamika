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
  const copyRef = useRef<HTMLDivElement>(null)
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

    // Copy/hint react to scroll via direct style writes (not React state) so this
    // runs every animation frame without triggering re-renders.
    function updateCopyStyles(raw: number) {
      const copy = copyRef.current
      const hint = hintRef.current
      if (copy) {
        // Text itself is always fully opaque (never gated behind scroll — an
        // opacity-hidden LCP element is exactly what tanks the LCP score). The
        // "reveal" is a small settle-in motion over the first slice of scroll.
        const t = Math.min(Math.max(raw / 0.1, 0), 1)
        const eased = t * t * (3 - 2 * t)
        copy.style.transform = `translateY(${(1 - eased) * 14}px) scale(${0.985 + eased * 0.015})`
      }
      if (hint) {
        const t = Math.min(Math.max(raw / 0.15, 0), 1)
        hint.style.opacity = String(1 - t)
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion && copyRef.current) {
      copyRef.current.style.transform = 'translateY(0) scale(1)'
      if (hintRef.current) hintRef.current.style.display = 'none'
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

      // Piggyback the copy/hint style updates on the same cadence as the 3D loop by
      // polling via a lightweight rAF here too — kept separate from heroScene's own
      // loop so the (framework-agnostic) scene module never has to know about our
      // DOM copy elements.
      function cosmeticLoop() {
        updateCopyStyles(getProgress())
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
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-screen w-screen" />

      {contextLost && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-glaze-mid via-glaze-deep to-ink"
        >
          <div className="h-40 w-40 rounded-full bg-[radial-gradient(circle_at_45%_40%,#C8CCD5,#77899E_55%,#363F49)] opacity-70 sm:h-56 sm:w-56" />
        </div>
      )}

      <div className="sticky top-0 grid h-screen place-items-center">
        <div ref={copyRef} className="relative z-[2] px-6 text-center">
          {eyebrow && (
            <div className="mb-4 text-xs uppercase tracking-[0.28em] text-glaze">{eyebrow}</div>
          )}
          {headline && (
            <h1 className="font-display text-[clamp(38px,7vw,86px)] font-normal leading-[0.98] tracking-tight text-ink">
              {renderHeadline(headline)}
            </h1>
          )}
          {sub && (
            <p className="mx-auto mt-5 max-w-[34ch] text-[15px] leading-relaxed text-muted">{sub}</p>
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

      <div
        ref={hintRef}
        aria-hidden
        className="fixed bottom-8 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted motion-reduce:hidden"
      >
        <span>Scroll</span>
        <span className="relative h-8 w-px overflow-hidden bg-black/10">
          <span className="absolute inset-x-0 -top-8 h-8 animate-[hero-scroll-hint_2s_ease-in-out_infinite] bg-glaze" />
        </span>
      </div>
    </div>
  )
}
