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
  const categories = (await getAllCatalog(locale)).filter((category) => category.items.length > 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">{nav.produits}</h1>

      {categories.length === 0 ? (
        <p className="mt-8 text-muted">{nav.aucuneCategorie}</p>
      ) : (
        <div className="mt-12 flex flex-col gap-16">
          {categories.map((category) => (
            <section key={category.id}>
              <div className="mb-6 flex items-baseline justify-between">
                <Link
                  href={paths.categorie(locale, category.slug)}
                  className="font-display text-2xl text-ink hover:text-glaze-deep"
                >
                  {category.name}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                {category.items.slice(0, PREVIEW_COUNT).map((item) => (
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
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
