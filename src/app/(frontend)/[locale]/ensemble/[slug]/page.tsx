import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isValidLocale, getNavDict, paths } from '@/lib/i18n'
import { getSetBySlug } from '@/lib/queries'
import type { SetDetail } from '@/lib/queries'
import { formatPriceTND } from '@/lib/price'
import Gallery from '@/components/product/Gallery'
import AddToCart from '@/components/cart/AddToCart'

type Params = { locale: string; slug: string }

function plainTextExcerpt(description: SetDetail['description']): string | undefined {
  if (!description) return undefined
  const firstParagraph = description.root?.children?.find(
    (node): node is typeof node & { children: { text?: string }[] } =>
      Array.isArray((node as { children?: unknown }).children),
  )
  const text = firstParagraph?.children?.map((child) => child.text ?? '').join('')
  return text?.slice(0, 160)
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}
  const set = await getSetBySlug(slug, locale)
  if (!set) return {}
  return {
    title: `${set.name} — Maison Dinamika`,
    description: plainTextExcerpt(set.description),
    openGraph: set.images[0] ? { images: [{ url: set.images[0].url }] } : undefined,
  }
}

export default async function SetPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()

  const set = await getSetBySlug(slug, locale)
  if (!set) notFound()

  const nav = getNavDict(locale)

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Gallery images={set.images} altFallback={set.name} />

        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            {set.name}{' '}
            <span className="ms-3 align-middle rounded-sm bg-glaze-light px-2 py-1 text-sm font-normal text-glaze-dark">
              {nav.ensemble}
            </span>
          </h1>
          {/* This uses the SET's own price/stock — deliberately independent of the
              sum of its components' prices/stock (see Sets.ts). */}
          <div className="mt-3 text-xl text-glaze">{formatPriceTND(set.priceTND)}</div>

          {set.stock <= 0 && <p className="mt-2 text-sm text-rim-brown">{nav.ruptureDeStock}</p>}

          {set.description && (
            <div className="prose prose-neutral mt-8 max-w-none text-muted">
              <RichText data={set.description} />
            </div>
          )}

          {set.components.length > 0 && (
            <div className="mt-8 rounded-2xl border border-line bg-surface/40 p-7">
              <h2 className="font-display text-lg text-ink">{nav.contenuDeLEnsemble}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {set.components.map((component) => (
                  <li key={component.product.id}>
                    <Link
                      href={paths.produit(locale, component.product.slug)}
                      className="flex items-baseline gap-2 rounded-sm text-sm hover:text-glaze-deep"
                    >
                      <span className="font-medium text-ink">{component.qty} ×</span>
                      <span className="text-muted">{component.product.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <AddToCart
              itemType="set"
              id={set.id}
              slug={set.slug}
              name={set.name}
              priceTND={set.priceTND}
              image={set.images[0]?.url ?? null}
              maxStock={set.stock}
              labels={{
                add: nav.ajouterAuPanier,
                outOfStock: nav.ruptureDeStock,
                added: nav.ajouteAuPanier,
                decrease: nav.diminuerQuantite,
                increase: nav.augmenterQuantite,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
