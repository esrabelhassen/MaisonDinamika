import Link from 'next/link'
import { isValidLocale, paths, getNavDict } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { getAllCatalog } from '@/lib/queries'
import CatalogCard from '@/components/catalog/CatalogCard'

const PREVIEW_COUNT = 4

export default async function ProduitsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const nav = getNavDict(locale)
  // Category is a grouping label only (no page/link) — only sous-catégories
  // with at least one published item are worth showing, same as before.
  const categories = (await getAllCatalog(locale))
    .map((category) => ({
      ...category,
      sousCategories: category.sousCategories.filter((sc) => sc.items.length > 0),
    }))
    .filter((category) => category.sousCategories.length > 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <h1 className="font-display text-4xl text-ink">{nav.produits}</h1>

      {categories.length === 0 ? (
        <p className="mt-8 text-muted">{nav.aucuneCategorie}</p>
      ) : (
        <div className="mt-12 flex flex-col gap-16">
          {categories.map((category) => (
            <section key={category.id} className="flex flex-col gap-12">
              <h2 className="font-display text-2xl text-ink">{category.name}</h2>
              {category.sousCategories.map((sousCategorie) => (
                <div key={sousCategorie.id}>
                  <div className="mb-6 flex items-baseline justify-between">
                    <Link
                      href={paths.sousCategorie(locale, sousCategorie.slug)}
                      className="font-display text-xl text-ink hover:text-glaze-deep"
                    >
                      {sousCategorie.name}
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                    {sousCategorie.items.slice(0, PREVIEW_COUNT).map((item) => (
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
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
