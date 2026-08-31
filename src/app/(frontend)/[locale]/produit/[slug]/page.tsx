import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import { getProductBySlug } from '@/lib/queries'
import type { ProductDetail } from '@/lib/queries'
import { formatPriceTND } from '@/lib/price'
import Gallery from '@/components/product/Gallery'
import AddToCart from '@/components/cart/AddToCart'

type Params = { locale: string; slug: string }

function plainTextExcerpt(description: ProductDetail['description']): string | undefined {
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
  const product = await getProductBySlug(slug, locale)
  if (!product) return {}
  return {
    title: `${product.name} — Maison Dinamika`,
    description: plainTextExcerpt(product.description),
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url }] } : undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()

  const product = await getProductBySlug(slug, locale)
  if (!product) notFound()

  const nav = getNavDict(locale)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Gallery images={product.images} altFallback={product.name} />

        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{product.name}</h1>
          <div className="mt-3 text-xl text-glaze">{formatPriceTND(product.priceTND)}</div>

          {product.stock <= 0 && (
            <p className="mt-2 text-sm text-rim-brown">{nav.ruptureDeStock}</p>
          )}

          {product.description && (
            <div className="prose prose-neutral mt-8 max-w-none text-muted">
              <RichText data={product.description} />
            </div>
          )}

          <div className="mt-8">
            <AddToCart
              itemType="product"
              id={product.id}
              slug={product.slug}
              name={product.name}
              priceTND={product.priceTND}
              image={product.images[0]?.url ?? null}
              maxStock={product.stock}
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
