import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import type { LogoRef } from '@/lib/media'

// Shared between the header (client, blend-mode depends on scroll state) and the
// footer (server, static). No hooks here, so it works in either boundary as-is.
export default function Logo({
  locale,
  logo,
  brandName,
  heightClassName,
  textClassName,
  imageClassName = '',
  linkClassName = '',
}: {
  locale: Locale
  /** Resolved via `resolveLogo()` — null means "no logo set", which always falls
   * back to the text wordmark, never a broken image. */
  logo: LogoRef | null
  brandName: string
  /** Tailwind height utility for the rendered mark — a plain "h-9" or a responsive
   * "h-8 lg:h-11". Width always follows the logo's real aspect ratio (w-auto),
   * so nothing stretches, squashes, or shifts layout at any breakpoint. */
  heightClassName: string
  /** Classes for the fallback text wordmark (font-display is applied here always). */
  textClassName: string
  /** Extra classes for the image itself (e.g. a blend mode over a transparent header). */
  imageClassName?: string
  linkClassName?: string
}) {
  return (
    <Link href={paths.home(locale)} className={`inline-flex items-center rounded-sm ${linkClassName}`}>
      {logo ? (
        logo.isSvg ? (
          // SVG is vector art — Next's image optimizer refuses to process SVGs
          // unless `dangerouslyAllowSVG` is turned on in next.config.ts (a
          // security trade-off not worth making here), and there's no
          // compression/responsive-size benefit to optimizing vector art anyway.
          // A plain <img> still gets explicit width/height (no layout shift) and
          // stays perfectly crisp at any size, unlike a raster fallback would.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo.url}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={`${heightClassName} w-auto ${imageClassName}`}
          />
        ) : (
          <Image
            src={logo.url}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={`${heightClassName} w-auto ${imageClassName}`}
          />
        )
      ) : (
        <span className={`font-display ${textClassName}`}>{brandName}</span>
      )}
    </Link>
  )
}
