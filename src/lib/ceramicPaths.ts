// Pure numeric/string data — no `three`, no DOM. Deliberately standalone: nothing
// here imports from or is imported by src/components/hero/*.
//
// PLATE_PROFILE / BOWL_PROFILE below are hand-copied from the point arrays inside
// plateProfile()/bowlProfile() in src/components/hero/heroScene.ts (as of this
// writing). They are lathe profiles: x is radius from the dish's center (0 → rim),
// y is height, and the rig revolves this single half-profile 360° around the
// vertical axis to build the real 3D dish. We never touch or import that file —
// only these copied numbers, used for a completely different (2D/SVG) purpose.
//
// Revolving a profile 360° and then looking at the result from the side (as a
// flat silhouette) always produces a shape that's the profile mirrored across
// the rotation axis — the near and far walls of the revolved solid project onto
// the same 2D outline. So mirroring PLATE_PROFILE/BOWL_PROFILE across x = 0 and
// stitching the two halves into one closed loop gives a 2D side-view silhouette
// that matches the real dish's proportions, with zero dependency on the rig.

type Point = readonly [number, number]

const PLATE_PROFILE: readonly Point[] = [
  [0.0, 0.06],
  [0.34, 0.045],
  [0.6, 0.05],
  [0.8, 0.12],
  [0.94, 0.185],
  [1.0, 0.2],
  [1.0, 0.12],
  [0.9, 0.082],
  [0.66, 0.072],
  [0.64, 0.0],
  [0.56, 0.0],
  [0.54, 0.072],
  [0.2, 0.076],
  [0.0, 0.078],
]

const BOWL_PROFILE: readonly Point[] = [
  [0.0, 0.07],
  [0.3, 0.03],
  [0.52, 0.07],
  [0.74, 0.32],
  [0.86, 0.56],
  [0.9, 0.62],
  [0.855, 0.615],
  [0.78, 0.47],
  [0.6, 0.23],
  [0.4, 0.095],
  [0.34, 0.0],
  [0.26, 0.0],
  [0.24, 0.085],
  [0.1, 0.092],
  [0.0, 0.094],
]

/** Mirrors a half-profile across x = 0 and stitches both halves into one closed
 * point loop. Both profiles above start and end at x === 0 exactly, so the two
 * seams land on identical points — we drop those duplicates (the SVG path closes
 * back to its own first point via `Z` anyway). */
function mirrorAndClose(profile: readonly Point[]): Point[] {
  const mirrored: Point[] = profile.map(([x, y]) => [-x, y])
  const reversedMirror = [...mirrored].reverse().slice(1, -1)
  return [...profile, ...reversedMirror]
}

function boundingBox(points: readonly Point[]) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

/** Fits a point list into a `size` × `size` box (uniform scale, centered,
 * `padding` kept clear on every side) so every exported path shares the same
 * viewBox regardless of the source profile's native proportions. */
function normalize(points: readonly Point[], size: number, padding: number): Point[] {
  const { minX, maxX, minY, maxY } = boundingBox(points)
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const scale = (size - padding * 2) / Math.max(w, h)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const offset = size / 2
  return points.map(([x, y]) => [offset + (x - cx) * scale, offset + (y - cy) * scale])
}

function toPathD(points: readonly Point[], close: boolean): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  const segments = [
    `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`,
    ...rest.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`),
  ]
  if (close) segments.push('Z')
  return segments.join(' ')
}

/** Every exported path shares this viewBox — size the <svg> element itself via
 * CSS width/height in the component, not by touching these coordinates. */
export const CERAMIC_VIEWBOX_SIZE = 100
export const CERAMIC_VIEWBOX = `0 0 ${CERAMIC_VIEWBOX_SIZE} ${CERAMIC_VIEWBOX_SIZE}`

const SIZE = CERAMIC_VIEWBOX_SIZE
const PADDING = 6

/** Full, closed plate silhouette (mirrored side-view outline). */
export const plateOutlinePath = toPathD(normalize(mirrorAndClose(PLATE_PROFILE), SIZE, PADDING), true)

/** Full, closed bowl silhouette (mirrored side-view outline). */
export const bowlOutlinePath = toPathD(normalize(mirrorAndClose(BOWL_PROFILE), SIZE, PADDING), true)

/** Optional: the un-mirrored half-profile alone — a single flowing open curve
 * (the plate's rim line), for a lighter accent shape among the silhouettes. */
export const plateProfileLinePath = toPathD(normalize(PLATE_PROFILE, SIZE, PADDING), false)

/** Same, for the bowl's taller rim curve. */
export const bowlProfileLinePath = toPathD(normalize(BOWL_PROFILE, SIZE, PADDING), false)
