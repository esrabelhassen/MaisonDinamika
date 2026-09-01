import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isValidLocale } from '@/lib/i18n'
import { allGalleryImages } from '@/lib/media'
import type { Media } from '@/payload-types'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const payload = await getPayload({ config })
  const apropos = await payload.findGlobal({ slug: 'apropos', locale, overrideAccess: false })
  const title = apropos.title || 'À propos'
  return { title: `${title} — Maison Dinamika` }
}

export default async function AProposPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const payload = await getPayload({ config })
  const apropos = await payload.findGlobal({ slug: 'apropos', locale, overrideAccess: false })
  // Apropos.images' `image` sub-field isn't marked required in the schema (unlike
  // Products/Sets), so an admin could in theory leave a row empty — filter those
  // out before handing off to the shared (stricter-typed) gallery helper.
  const validImages = (apropos.images ?? []).filter(
    (entry): entry is { image: number | Media; id?: string | null } => entry.image != null,
  )
  const images = allGalleryImages(validImages, apropos.title || 'Maison Dinamika')
  const hasImages = images.length > 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div
        className={`grid grid-cols-1 items-start gap-16 ${hasImages ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}
      >
        <div className={hasImages ? '' : 'mx-auto max-w-[65ch] text-center'}>
          {apropos.title && (
            <h1
              className={`font-display text-4xl leading-tight text-ink sm:text-5xl ${
                hasImages ? '' : 'mx-auto max-w-[20ch]'
              }`}
            >
              {apropos.title}
            </h1>
          )}

          <div
            aria-hidden
            className={`mt-6 h-px w-16 bg-glaze-light ${hasImages ? '' : 'mx-auto'}`}
          />

          {apropos.body && (
            <div
              className={`
                mt-8 text-[15px] leading-relaxed text-muted
                [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-ink [&_h3]:tracking-wide
                [&_h3+p]:mt-4 [&_p]:mt-4
                [&_em]:not-italic [&_em]:italic [&_em]:text-glaze-deep
                [&_p:last-of-type]:mt-10 [&_p:last-of-type]:border-t [&_p:last-of-type]:border-glaze-light
                [&_p:last-of-type]:pt-8 [&_p:last-of-type]:font-display [&_p:last-of-type]:text-xl
                [&_p:last-of-type]:italic [&_p:last-of-type]:text-glaze-deep
                ${hasImages ? '' : 'mx-auto'}
              `}
            >
              <RichText data={apropos.body} />
            </div>
          )}
        </div>

        {hasImages && (
          <div className="grid grid-cols-2 gap-4 self-center">
            {images.slice(0, 4).map((image, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-glaze-light ${
                  i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
