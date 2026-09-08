import { notFound } from 'next/navigation'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import { getCollectionsByCategory } from '@/lib/queries'
import CollectionPeekRow from '@/components/collection/CollectionPeekRow'

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
  // never happen via the admin, but a collection with no images would have no
  // photo for its card.
  const categories = (await getCollectionsByCategory(locale))
    .map((category) => ({ ...category, collections: category.collections.filter((c) => c.images.length > 0) }))
    .filter((category) => category.collections.length > 0)

  if (categories.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <p className="font-display text-2xl text-muted">{nav.collectionBientot}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16 py-16 sm:gap-20 sm:py-24">
      {categories.map((category) => (
        <section key={category.id}>
          {/* Category is a grouping label here too, same as the Produits menu
              and index — not a link, no page of its own. */}
          <h2 className="mx-auto max-w-6xl px-6 font-display text-2xl text-ink sm:text-3xl">{category.name}</h2>
          <CollectionPeekRow
            locale={locale}
            collections={category.collections}
            labels={{ previous: nav.collectionPrecedente, next: nav.collectionSuivante }}
          />
        </section>
      ))}
    </div>
  )
}
