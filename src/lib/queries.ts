import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'
import type { Category, Collection, Product, Set } from '@/payload-types'
import { allGalleryImages, collectionBandImages, firstCardImage } from '@/lib/media'
import type { BandImage, ImageRef } from '@/lib/media'
import type { CatalogCardItem } from '@/components/catalog/CatalogCard'

function isDoc<T>(value: T | number | null | undefined): value is T {
  return typeof value === 'object' && value !== null
}

async function client() {
  return getPayload({ config })
}

export function toCatalogItem(kind: 'product' | 'set', doc: Product | Set): CatalogCardItem {
  const image = firstCardImage(doc.images, doc.name)
  return {
    kind,
    id: doc.id,
    name: doc.name,
    slug: doc.slug ?? '',
    priceTND: doc.priceTND,
    stock: doc.stock,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? doc.name,
  }
}

function publishedItems(category: Category): CatalogCardItem[] {
  const products = (category.products ?? [])
    .filter((p): p is Product => isDoc<Product>(p))
    .filter((p) => p.status === 'published')
    .map((p) => toCatalogItem('product', p))
  const sets = (category.sets ?? [])
    .filter((s): s is Set => isDoc<Set>(s))
    .filter((s) => s.status === 'published')
    .map((s) => toCatalogItem('set', s))
  return [...products, ...sets]
}

export type CategoryListing = { id: number; name: string; slug: string; order: number }

/** Plain category list — no items populated, for lightweight uses (nav, breadcrumbs). */
export async function getCategories(locale: Locale): Promise<CategoryListing[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'categories',
    sort: 'order',
    locale,
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })
  return docs.map((c) => ({ id: c.id, name: c.name, slug: c.slug ?? '', order: c.order ?? 0 }))
}

export type CategoryWithItems = CategoryListing & { items: CatalogCardItem[] }

/** Every category with its published products+sets populated — feeds the produits index. */
export async function getAllCatalog(locale: Locale): Promise<CategoryWithItems[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'categories',
    sort: 'order',
    locale,
    depth: 2,
    limit: 100,
    overrideAccess: false,
  })
  return docs.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug ?? '',
    order: c.order ?? 0,
    items: publishedItems(c),
  }))
}

export async function getCategoryBySlug(slug: string, locale: Locale): Promise<CategoryWithItems | null> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    locale,
    depth: 2,
    limit: 1,
    overrideAccess: false,
  })
  const category = docs[0]
  if (!category) return null
  return {
    id: category.id,
    name: category.name,
    slug: category.slug ?? '',
    order: category.order ?? 0,
    items: publishedItems(category),
  }
}

export type ProductDetail = {
  id: number
  name: string
  slug: string
  priceTND: number
  stock: number
  description: Product['description']
  images: ImageRef[]
}

export async function getProductBySlug(slug: string, locale: Locale): Promise<ProductDetail | null> {
  const payload = await client()
  // `status: published` in `where` is belt-and-suspenders — Products' own access
  // control already restricts anonymous (overrideAccess:false) reads to published
  // docs, so an unpublished slug already resolves to zero docs without this.
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    locale,
    depth: 2,
    limit: 1,
    overrideAccess: false,
  })
  const product = docs[0]
  if (!product) return null
  return {
    id: product.id,
    name: product.name,
    slug: product.slug ?? '',
    priceTND: product.priceTND,
    stock: product.stock,
    description: product.description,
    images: allGalleryImages(product.images, product.name),
  }
}

export type CollectionBandData = {
  id: number
  title: string
  order: number
  overlayStyle: 'light' | 'dark'
  images: BandImage[]
}

/** Showcase collections (the /collection marquee page), sorted for display order. */
export async function getCollections(locale: Locale): Promise<CollectionBandData[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'collections',
    sort: 'order',
    locale,
    depth: 2,
    limit: 100,
    overrideAccess: false,
  })
  return docs.map((doc: Collection) => ({
    id: doc.id,
    title: doc.title,
    order: doc.order ?? 0,
    overlayStyle: doc.overlayStyle ?? 'light',
    images: collectionBandImages(doc.images, doc.title),
  }))
}

export type SetComponentRef = { qty: number; product: { id: number; name: string; slug: string } }
export type SetDetail = ProductDetail & { components: SetComponentRef[] }

export async function getSetBySlug(slug: string, locale: Locale): Promise<SetDetail | null> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'sets',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    locale,
    depth: 2,
    limit: 1,
    overrideAccess: false,
  })
  const set = docs[0]
  if (!set) return null

  const components: SetComponentRef[] = (set.components ?? [])
    .filter((c): c is typeof c & { product: Product } => isDoc<Product>(c.product))
    .map((c) => ({ qty: c.qty, product: { id: c.product.id, name: c.product.name, slug: c.product.slug ?? '' } }))

  return {
    id: set.id,
    name: set.name,
    slug: set.slug ?? '',
    priceTND: set.priceTND,
    stock: set.stock,
    description: set.description,
    images: allGalleryImages(set.images, set.name),
    components,
  }
}
