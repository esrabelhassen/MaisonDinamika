import { notFound } from 'next/navigation'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import { getCollections } from '@/lib/queries'
import CollectionCarousel from '@/components/collection/CollectionCarousel'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  return { title: 'Collection — Maison Dinamika' }
}

export default async function CollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const nav = getNavDict(locale)
  // Belt-and-suspenders: `images` has minRows:1 in the schema, so this should
  // never happen via the admin, but a collection with no images would otherwise
  // have no photo to show as its carousel slide.
  const collections = (await getCollections(locale)).filter((c) => c.images.length > 0)

  if (collections.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <p className="font-display text-2xl text-muted">{nav.collectionBientot}</p>
      </div>
    )
  }

  return (
    <div className="py-16 sm:py-24">
      <CollectionCarousel
        collections={collections}
        labels={{ previous: nav.collectionPrecedente, next: nav.collectionSuivante }}
      />
    </div>
  )
}
