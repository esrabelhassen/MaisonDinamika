import type { Media } from '@/payload-types'

export type ImageRef = { url: string; alt: string }

function isMediaDoc(value: unknown): value is Media {
  return typeof value === 'object' && value !== null
}

/** First image of a Products/Sets `images` array, sized for a card (falls back to the
 * original if no `card` derivative exists — e.g. a non-image upload or a very small
 * source). Returns null if there's no image at all (cards render a placeholder). */
export function firstCardImage(
  images: { image: number | Media }[] | null | undefined,
  fallbackAlt: string,
): ImageRef | null {
  const first = images?.[0]?.image
  if (!isMediaDoc(first)) return null
  const url = first.sizes?.card?.url ?? first.url
  if (!url) return null
  return { url, alt: first.alt || fallbackAlt }
}

/** All images of a Products/Sets `images` array, sized for a full-size gallery view. */
export function allGalleryImages(
  images: { image: number | Media }[] | null | undefined,
  fallbackAlt: string,
): ImageRef[] {
  return (images ?? [])
    .map(({ image }) => image)
    .filter(isMediaDoc)
    .map((media) => {
      const url = media.sizes?.hero?.url ?? media.url
      return url ? { url, alt: media.alt || fallbackAlt } : null
    })
    .filter((ref): ref is ImageRef => ref !== null)
}

export type LogoRef = { url: string; alt: string; width: number; height: number; isSvg: boolean }

/** SiteSettings' `logo` upload, resolved for the header/footer wordmark. Returns null
 * when no logo is set (or the relationship didn't resolve to a document) — callers
 * fall back to the text wordmark in that case, never a broken image. */
export function resolveLogo(
  logo: number | Media | null | undefined,
  brandName: string,
): LogoRef | null {
  if (!isMediaDoc(logo)) return null
  const isSvg = logo.mimeType === 'image/svg+xml'
  // SVG is vector — Payload/sharp never generates raster derivatives for it (only
  // the original file exists), and a small raster mark rarely needs anything
  // bigger than the `thumbnail` derivative either.
  const url = isSvg ? logo.url : (logo.sizes?.thumbnail?.url ?? logo.url)
  if (!url) return null
  // Fallback aspect ratio (3:1) only matters if Payload/sharp couldn't read real
  // dimensions at all — keeps next/image's required width/height from crashing.
  const width = (isSvg ? logo.width : (logo.sizes?.thumbnail?.width ?? logo.width)) ?? 3
  const height = (isSvg ? logo.height : (logo.sizes?.thumbnail?.height ?? logo.height)) ?? 1
  return { url, alt: logo.alt || brandName, width, height, isSvg }
}

export type BandImage = ImageRef & { width: number; height: number }

/** Images for a /collection entry — carries the real width/height (Payload stores
 * both on every upload) even though the carousel only ever shows the first one
 * (`fill` + `object-cover`, no aspect-ratio math needed there); kept on the type
 * in case a future admin-configurable slide picker needs the rest of the set. */
export function collectionBandImages(
  images: { image: number | Media }[] | null | undefined,
  fallbackAlt: string,
): BandImage[] {
  return (images ?? [])
    .map(({ image }) => image)
    .filter(isMediaDoc)
    .map((media) => {
      const size = media.sizes?.hero
      const url = size?.url ?? media.url
      const width = size?.width ?? media.width
      const height = size?.height ?? media.height
      if (!url || !width || !height) return null
      return { url, alt: media.alt || fallbackAlt, width, height }
    })
    .filter((ref): ref is BandImage => ref !== null)
}
