import { notFound } from 'next/navigation'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import { getCategoryBySlug } from '@/lib/queries'
import CatalogCard from '@/components/catalog/CatalogCard'

type Params = { locale: string; categorySlug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, categorySlug } = await params
  if (!isValidLocale(locale)) return {}
  const category = await getCategoryBySlug(categorySlug, locale)
  if (!category) return {}
  return { title: `${category.name} — Maison Dinamika` }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { locale, categorySlug } = await params
  if (!isValidLocale(locale)) notFound()

  const category = await getCategoryBySlug(categorySlug, locale)
  if (!category) notFound()

  const nav = getNavDict(locale)

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <h1 className="font-display text-4xl text-ink">{category.name}</h1>

      {category.items.length === 0 ? (
        <p className="mt-8 text-muted">{nav.aucunProduit}</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.items.map((item) => (
            <CatalogCard
              key={`${item.kind}-${item.id}`}
              locale={locale}
              item={item}
              labels={{
                ensemble: nav.ensemble,
                add: nav.ajouterAuPanier,
                added: nav.ajouteAuPanier,
                outOfStock: nav.ruptureDeStock,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
