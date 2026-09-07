import { notFound } from 'next/navigation'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import { getSousCategorieBySlug } from '@/lib/queries'
import CatalogCard from '@/components/catalog/CatalogCard'

type Params = { locale: string; sousCategorieSlug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, sousCategorieSlug } = await params
  if (!isValidLocale(locale)) return {}
  const sousCategorie = await getSousCategorieBySlug(sousCategorieSlug, locale)
  if (!sousCategorie) return {}
  return { title: `${sousCategorie.name} — Maison Dinamika` }
}

export default async function SousCategoriePage({ params }: { params: Promise<Params> }) {
  const { locale, sousCategorieSlug } = await params
  if (!isValidLocale(locale)) notFound()

  const sousCategorie = await getSousCategorieBySlug(sousCategorieSlug, locale)
  if (!sousCategorie) notFound()

  const nav = getNavDict(locale)

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      {sousCategorie.categoryName && (
        <div className="mb-2 text-sm uppercase tracking-[0.14em] text-muted">{sousCategorie.categoryName}</div>
      )}
      <h1 className="font-display text-4xl text-ink">{sousCategorie.name}</h1>

      {sousCategorie.items.length === 0 ? (
        <p className="mt-8 text-muted">{nav.aucunProduit}</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sousCategorie.items.map((item) => (
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
