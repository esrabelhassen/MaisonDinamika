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

export type BandImage = ImageRef & { width: number; height: number }

/** Images for the /collection marquee bands — carries the real width/height (Payload
 * stores both on every upload) so the band can size each image by aspect ratio at a
 * fixed height, and so the total row width can be computed without waiting for the
 * images to actually load in the browser. */
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
