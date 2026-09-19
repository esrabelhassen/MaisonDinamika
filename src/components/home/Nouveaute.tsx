import type { Locale } from '@/lib/i18n'
import CatalogCard from '@/components/catalog/CatalogCard'
import type { CatalogCardItem, CatalogCardLabels } from '@/components/catalog/CatalogCard'
import NouveauteHeading from './NouveauteHeading'

export type NouveauteItem = CatalogCardItem

// Sits above the fixed hero canvas (z-index + solid paper bg) so it visually "covers"
// it as the page scrolls, same layering the prototype used for its .after-wrap.
export default function Nouveaute({
  locale,
  heading,
  items,
  labels,
}: {
  locale: Locale
  heading?: string | null
  items: NouveauteItem[]
  labels: CatalogCardLabels
}) {
  if (items.length === 0) return null

  return (
    <section className="relative z-[2] bg-paper px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {heading && <NouveauteHeading heading={heading} />}

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {items.map((item) => (
            <CatalogCard key={`${item.kind}-${item.id}`} locale={locale} item={item} labels={labels} />
          ))}
        </div>
      </div>
    </section>
  )
}
