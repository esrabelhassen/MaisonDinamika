import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { paths } from '@/lib/i18n'
import { formatPriceTND } from '@/lib/price'

export type CatalogCardItem = {
  kind: 'product' | 'set'
  id: number
  name: string
  slug: string
  priceTND: number
  imageUrl: string | null
  imageAlt: string
}

// The one card language for the whole storefront — first used for the Nouveauté
// section, reused everywhere else a product/set is listed (produits index, category
// grid) so nothing invents a second visual treatment.
export default function CatalogCard({
  locale,
  item,
  ensembleLabel,
}: {
  locale: Locale
  item: CatalogCardItem
  ensembleLabel: string
}) {
  const href = item.kind === 'set' ? paths.ensemble(locale, item.slug) : paths.produit(locale, item.slug)

  return (
    <Link
      href={href}
      className="group block min-w-0 rounded-2xl border border-glaze-light bg-white/40 p-5 transition-colors hover:border-glaze motion-reduce:transition-none"
    >
      <div className="relative mb-5 h-40 overflow-hidden rounded-xl bg-glaze-light">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
      </div>
      <h3 className="font-display text-xl text-ink">
        {item.name}
        {/* A real space, not just margin — margin isn't a line-break opportunity,
            so without this the name+badge become one unwrappable run of text. */}
        {item.kind === 'set' && ' '}
        {item.kind === 'set' && (
          <span className="ms-2 rounded-sm bg-glaze-light px-1.5 py-0.5 align-middle text-xs font-normal text-glaze-dark">
            {ensembleLabel}
          </span>
        )}
      </h3>
      <div className="mt-1 text-sm text-glaze">{formatPriceTND(item.priceTND)}</div>
    </Link>
  )
}
