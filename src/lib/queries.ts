import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'
import type { Category, Product, Set, SousCategory } from '@/payload-types'
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

function publishedItems(sousCategorie: SousCategory): CatalogCardItem[] {
  const products = (sousCategorie.products ?? [])
    .filter((p): p is Product => isDoc<Product>(p))
    .filter((p) => p.status === 'published')
    .map((p) => toCatalogItem('product', p))
  const sets = (sousCategorie.sets ?? [])
    .filter((s): s is Set => isDoc<Set>(s))
    .filter((s) => s.status === 'published')
    .map((s) => toCatalogItem('set', s))
  return [...products, ...sets]
}

export type SousCategorieListing = { id: number; name: string; slug: string; order: number }
export type SousCategorieWithItems = SousCategorieListing & { items: CatalogCardItem[] }
export type CategoryWithSousCategories = {
  id: number
  name: string
  order: number
  sousCategories: SousCategorieWithItems[]
}

/** Every category, each with its sous-catégories (each carrying its own
 * published products+sets) — feeds the produits index. Categories themselves
 * have no page/slug worth exposing anymore — only their sous-catégories do. */
export async function getAllCatalog(locale: Locale): Promise<CategoryWithSousCategories[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'sous-categories',
    sort: 'order',
    locale,
    depth: 2,
    limit: 300,
    overrideAccess: false,
  })

  const byCategory = new Map<number, CategoryWithSousCategories>()
  for (const doc of docs) {
    const category = doc.category
    if (!isDoc<Category>(category)) continue // unresolved/deleted parent — skip defensively
    let bucket = byCategory.get(category.id)
    if (!bucket) {
      bucket = { id: category.id, name: category.name, order: category.order ?? 0, sousCategories: [] }
      byCategory.set(category.id, bucket)
    }
    bucket.sousCategories.push({
      id: doc.id,
      name: doc.name,
      slug: doc.slug ?? '',
      order: doc.order ?? 0,
      items: publishedItems(doc),
    })
  }

  return [...byCategory.values()].sort((a, b) => a.order - b.order)
}

export type SousCategorieWithParent = SousCategorieWithItems & { categoryName: string }

/** A single sous-catégorie by its slug — feeds /produits/[sousCategorieSlug]. */
export async function getSousCategorieBySlug(slug: string, locale: Locale): Promise<SousCategorieWithParent | null> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'sous-categories',
    where: { slug: { equals: slug } },
    locale,
    depth: 2,
    limit: 1,
    overrideAccess: false,
  })
  const doc = docs[0]
  if (!doc) return null
  const category = doc.category
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug ?? '',
    order: doc.order ?? 0,
    categoryName: isDoc<Category>(category) ? category.name : '',
    items: publishedItems(doc),
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

export type CollectionCardData = {
  id: number
  title: string
  order: number
  overlayStyle: 'light' | 'dark'
  images: BandImage[]
  /** Where clicking this collection's card goes — its linked sous-catégorie's
   * product listing (/produits/[slug]). */
  sousCategorieSlug: string
}

export type CategoryWithCollections = {
  id: number
  name: string
  order: number
  collections: CollectionCardData[]
}

/** Showcase collections (the /collection page), grouped by the CATEGORY of
 * each collection's own linked sous-catégorie — a collection is never tagged
 * with a category directly, only through what it actually links to (see
 * Collections.ts). Both the grouping and each card's target come from the
 * exact same field, so they can never disagree. */
export async function getCollectionsByCategory(locale: Locale): Promise<CategoryWithCollections[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'collections',
    sort: 'order',
    locale,
    // collection -> sousCategorie (1) -> its category (2) -> images/media (also
    // within 2 of the collection doc) — 3 gives a little headroom above that.
    depth: 3,
    limit: 300,
    overrideAccess: false,
  })

  const byCategory = new Map<number, CategoryWithCollections>()
  for (const doc of docs) {
    const sousCategorie = doc.sousCategorie
    if (!isDoc<SousCategory>(sousCategorie)) continue // unresolved/deleted link — skip defensively
    const category = sousCategorie.category
    if (!isDoc<Category>(category)) continue

    let bucket = byCategory.get(category.id)
    if (!bucket) {
      bucket = { id: category.id, name: category.name, order: category.order ?? 0, collections: [] }
      byCategory.set(category.id, bucket)
    }
    bucket.collections.push({
      id: doc.id,
      title: doc.title,
      order: doc.order ?? 0,
      overlayStyle: doc.overlayStyle ?? 'light',
      images: collectionBandImages(doc.images, doc.title),
      sousCategorieSlug: sousCategorie.slug ?? '',
    })
  }

  return [...byCategory.values()].sort((a, b) => a.order - b.order)
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
