import { notFound } from 'next/navigation'
import { dirFor, isValidLocale, getNavDict } from '@/lib/i18n'
import { getCollections } from '@/lib/queries'
import CollectionBand from '@/components/collection/CollectionBand'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  return { title: 'Collection — Maison Dinamika' }
}

export default async function CollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const nav = getNavDict(locale)
  const dir = dirFor(locale)
  // Belt-and-suspenders: `images` has minRows:1 in the schema, so this should
  // never happen via the admin, but a band with no images would otherwise render
  // a broken/blank marquee.
  const collections = (await getCollections(locale)).filter((c) => c.images.length > 0)

  if (collections.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <p className="font-display text-2xl text-muted">{nav.collectionBientot}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16 py-16 sm:gap-24 sm:py-24">
      {collections.map((collection) => (
        <CollectionBand
          key={collection.id}
          title={collection.title}
          overlayStyle={collection.overlayStyle}
          images={collection.images}
          dir={dir}
        />
      ))}
    </div>
  )
}
