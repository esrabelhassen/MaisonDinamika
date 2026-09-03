import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidLocale } from '@/lib/i18n'
import { allGalleryImages } from '@/lib/media'
import type { Media } from '@/payload-types'

type Params = { locale: string }

// Hardcoded, not from the `apropos.title`/`apropos.body` CMS fields: same reasoning
// as the hero — this is core, always-shown content and it should never come up
// blank just because a given database doesn't have it filled in yet. The fields
// still exist in the schema and are still editable in /admin, nothing reads them
// anymore. Only the optional `images` gallery stays CMS-driven (it was already
// designed to degrade gracefully to a single centered text column with none set).
const TITLE = 'Qui sommes-nous'

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  return { title: `${TITLE} — Maison Dinamika` }
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
  const images = allGalleryImages(validImages, TITLE)
  const hasImages = images.length > 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div
        className={`grid grid-cols-1 items-start gap-16 ${hasImages ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}
      >
        <div className={hasImages ? '' : 'mx-auto max-w-[65ch] text-center'}>
          <h1
            className={`font-display text-4xl leading-tight text-ink sm:text-5xl ${
              hasImages ? '' : 'mx-auto max-w-[20ch]'
            }`}
          >
            {TITLE}
          </h1>

          <div
            aria-hidden
            className={`mt-6 h-px w-16 bg-line ${hasImages ? '' : 'mx-auto'}`}
          />

          <div
            className={`
              mt-8 text-[15px] leading-relaxed text-muted
              [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-ink [&_h3]:tracking-wide
              [&_h3+p]:mt-4 [&_p]:mt-4
              [&_em]:not-italic [&_em]:italic [&_em]:text-glaze-deep
              [&_p:last-of-type]:mt-10 [&_p:last-of-type]:border-t [&_p:last-of-type]:border-line
              [&_p:last-of-type]:pt-8 [&_p:last-of-type]:font-display [&_p:last-of-type]:text-xl
              [&_p:last-of-type]:italic [&_p:last-of-type]:text-glaze-deep
              ${hasImages ? '' : 'mx-auto'}
            `}
          >
            <h3>Maison Dinamika</h3>
            <p>
              Maison Dinamika est une enseigne tunisienne spécialisée dans l’art de la table et la décoration,
              pensée pour sublimer chaque intérieur avec élégance.
            </p>
            <p>
              Nous proposons une sélection de pièces soigneusement choisies pour composer une table harmonieuse
              et raffinée.
            </p>
            <p>
              Assiettes, bols, saladiers et accessoires de table sont disponibles{' '}
              <em>à la pièce ou en sets</em>, selon vos envies et vos besoins.
            </p>
            <p>
              Que ce soit pour votre quotidien, vos réceptions ou pour offrir, Maison Dinamika vous accompagne
              pour créer une table qui vous ressemble.
            </p>
            <p>
              <em>Maison Dinamika — L’art de la table, à votre façon.</em>
            </p>
          </div>
        </div>

        {hasImages && (
          <div className="grid grid-cols-2 gap-4 self-center">
            {images.slice(0, 4).map((image, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-surface ${
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
