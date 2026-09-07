// Pure, framework-free camera math for the room-tour hero — no `three`, no DOM.
// Shared by BOTH the WebGL path (roomTourScene.ts, which turns this into shader
// uniforms) and the CSS-fallback / no-WebGL path (RoomTour.tsx, which turns the
// same numbers into a background-position/size/transform) so the two paths move
// through the room identically, and by the reduced-motion static layout (which
// just reads STOPS directly, no animation).
//
// Never imports from or is imported by src/components/hero/heroScene.ts or
// Hero.tsx — the dish hero stays completely untouched by this feature.

export type RoomTourStop = {
  label: string
  /** TODO(product-links): once specific products/categories are picked for each
   * stop (e.g. "Les vases" → a vases category, "L'art de la table" → the dining
   * set), wire this to a real href and render the caption as a Link. Left
   * `undefined` on purpose for now — every stop renders as a plain caption. */
  href?: string
  /** Fraction across the 1584×672 room photo, authored top-down/left-right like
   * normal image coordinates (0,0 = top-left) — NOT WebGL UV space. The GL path
   * flips `y` to v-space itself; the CSS path (background-position) uses these
   * top-down fractions directly, since that's what CSS already expects. */
  center: { x: number; y: number }
  /** Extra zoom applied on top of the shared base zoom, tuned per object so a
   * small cluster (the vases) reads as tightly framed and a wide one (the table
   * setting) doesn't feel cropped mid-object. */
  zoomMultiplier: number
}

// Room photo is 1584×672 (public/hero-tour/room.jpeg + room-depth.png, same size).
export const IMAGE_WIDTH = 1584
export const IMAGE_HEIGHT = 672
export const IMAGE_ASPECT = IMAGE_WIDTH / IMAGE_HEIGHT

// Left → right through the room, matching the photo's real layout. Kept LTR
// regardless of site direction — see RoomTour.tsx's RTL note: mirroring a real
// photograph (and its depth map) to match reading direction was judged not
// worth the risk for a decorative hero, so /ar plays the same tour, same order.
export const STOPS: RoomTourStop[] = [
  { label: 'Le plaid', center: { x: 0.13, y: 0.68 }, zoomMultiplier: 1.0 },
  { label: 'Les vases', center: { x: 0.42, y: 0.5 }, zoomMultiplier: 1.2 },
  { label: 'La plante', center: { x: 0.58, y: 0.48 }, zoomMultiplier: 0.95 },
  { label: 'L’art de la table', center: { x: 0.83, y: 0.62 }, zoomMultiplier: 0.85 },
]

const STOP_PROGRESS = STOPS.map((_, i) => i / (STOPS.length - 1)) // [0, 1/3, 2/3, 1]

// Base "how zoomed in" the tour sits at rest, before per-stop multipliers / the
// mid-transition dip / the portrait boost below. Tuned so the room always
// extends past the viewport — see computeCameraState's doc comment for how this
// combines with screen aspect.
const BASE_ZOOM = 3.0
// How much `zoom` DROPS at the midpoint of a stop→stop transition (a brief pull
// back before pushing back in on arrival — "move through the space").
const ZOOM_DIP = 0.55
// Continuous slow rotation, always present (the "never fully freezes" head-turn).
const TILT_DRIFT = 0.012
// Extra lean added only while actively transitioning, in the direction of travel.
const LEAN_AMOUNT = 0.02
const NUDGE_FREQ_X = 0.00035
const NUDGE_FREQ_Y = 0.00028
const TILT_FREQ = 0.00022
// How much of each stop's caption-visible window is fully opaque vs. fading.
// Stops sit 1/3 apart in progress, so each window+fade radius MUST stay well
// under half that (0.1665) or two captions get non-zero opacity at once —
// their absolutely-stacked text then visibly overlaps into a jumbled mess
// mid-transition (caught by screenshotting an actual transition, not just the
// four rest points). 0.06+0.05=0.11 leaves a real gap of full invisibility
// between one caption fading out and the next fading in.
const CAPTION_WINDOW = 0.06
const CAPTION_FADE = 0.05

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}

/** Narrow/portrait viewports need MORE zoom than wide ones to fill the screen
 * with a single object (the room photo is 2.35:1 — on a narrow phone, showing
 * even "1 zoom unit" worth of width already shows very little of the frame
 * height-wise, so without this a portrait visitor would see more of the room,
 * not less, which is backwards for "each object fills the viewport"). */
function portraitZoomBoost(screenAspect: number) {
  if (screenAspect >= 0.8) return 1
  const t = clamp((screenAspect - 0.4) / (0.8 - 0.4), 0, 1)
  return lerp(1.6, 1, t)
}

export type CameraState = {
  /** Top-down image-space fraction (0,0 = top-left), like STOPS[].center. */
  center: { x: number; y: number }
  zoom: number
  /** Radians. */
  tilt: number
  /** Unitless ~[-1, 1] per axis — the continuous "living camera" nudge; the GL
   * path scales this by depth for real parallax, the CSS path (no depth map)
   * uses it directly as a tiny uniform translate. */
  nudge: { x: number; y: number }
  /** Index of the stop currently most "arrived at" — for anything that just
   * needs a single active stop rather than the full per-stop opacity curve. */
  activeIndex: number
  /** One entry per STOPS[], 0..1 — how visible that stop's caption should be
   * right now. Windows never overlap (see CAPTION_WINDOW/CAPTION_FADE), so at
   * most one caption is ever meaningfully visible at a time. */
  captionOpacity: number[]
}

/**
 * Turns scroll progress (0..1 across the whole pinned hero) into where the
 * "camera" is looking. `screenAspect` (viewport width/height) feeds the
 * portrait zoom boost above; `timeMs` (a free-running clock, NOT progress —
 * typically `performance.now()`) drives the continuous drift/tilt so the shot
 * never goes perfectly static even while progress itself is momentarily still.
 */
export function computeCameraState(progress: number, screenAspect: number, timeMs: number): CameraState {
  const p = clamp(progress, 0, 1)

  let segIdx = 0
  for (let i = 0; i < STOP_PROGRESS.length - 1; i++) {
    if (p >= STOP_PROGRESS[i]) segIdx = i
  }
  segIdx = Math.min(segIdx, STOPS.length - 2)

  const segStart = STOP_PROGRESS[segIdx]
  const segEnd = STOP_PROGRESS[segIdx + 1]
  const rawT = segEnd > segStart ? clamp((p - segStart) / (segEnd - segStart), 0, 1) : 0
  const t = easeInOut(rawT)

  const from = STOPS[segIdx]
  const to = STOPS[segIdx + 1]

  const center = { x: lerp(from.center.x, to.center.x, t), y: lerp(from.center.y, to.center.y, t) }

  const zoomMul = lerp(from.zoomMultiplier, to.zoomMultiplier, t)
  const dip = Math.sin(Math.PI * rawT) // 0 at both ends of the segment, 1 at its midpoint
  const zoom = (BASE_ZOOM * zoomMul - dip * ZOOM_DIP) * portraitZoomBoost(screenAspect)

  const dirSign = Math.sign(to.center.x - from.center.x) || 1
  const lean = dip * LEAN_AMOUNT * dirSign
  const tilt = Math.sin(timeMs * TILT_FREQ) * TILT_DRIFT + lean

  const nudge = { x: Math.sin(timeMs * NUDGE_FREQ_X), y: Math.cos(timeMs * NUDGE_FREQ_Y) * 0.6 }

  const captionOpacity = STOPS.map((_, i) => {
    const dist = Math.abs(p - STOP_PROGRESS[i])
    if (dist <= CAPTION_WINDOW) return 1
    if (dist >= CAPTION_WINDOW + CAPTION_FADE) return 0
    return 1 - (dist - CAPTION_WINDOW) / CAPTION_FADE
  })

  const activeIndex = rawT < 0.5 ? segIdx : segIdx + 1

  return { center, zoom, tilt, nudge, activeIndex, captionOpacity }
}

/** Exported so the WebGL shader (roomTourScene.ts) uses the exact same number
 * rather than a second hand-typed copy. */
export const PARALLAX_STRENGTH = 0.03
