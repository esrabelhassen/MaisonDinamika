import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'
import type { Category } from '@/payload-types'
import { resolveLogo } from '@/lib/media'
import HeaderClient from './HeaderClient'
import type { CategoryNav, ContactData } from './types'

function isDoc<T>(value: T | number | null | undefined): value is T {
  return typeof value === 'object' && value !== null
}

export default async function Header({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })

  const [sousCategoriesResult, contact, settings] = await Promise.all([
    // depth: 1 resolves each sous-catégorie's `category` relationship to a
    // full Category doc (name/slug) — we don't need products/sets populated
    // here at all, the mega-panel only ever links to the sous-catégorie page.
    payload.find({
      collection: 'sous-categories',
      sort: 'order',
      depth: 1,
      locale,
      limit: 200,
      // No `user` here — this runs as an anonymous storefront visitor, so
      // overrideAccess: false enforces the collection's own public read rule.
      overrideAccess: false,
    }),
    payload.findGlobal({
      slug: 'contact',
      locale,
      overrideAccess: false,
    }),
    // depth: 1 (the default) is enough to resolve `logo` to a full Media doc so
    // resolveLogo() can read its url/sizes/mimeType.
    payload.findGlobal({
      slug: 'site-settings',
      locale,
      overrideAccess: false,
    }),
  ])

  const brandName = settings.brandName || 'Maison Dinamika'
  const logo = resolveLogo(settings.logo, brandName)

  // Group sous-catégories by their parent category — the menu shows Category
  // as a non-clickable heading with its sous-catégories listed under it (each
  // bucket's sous-catégories arrive already sorted by their own `order`; the
  // categories themselves are then re-sorted by the CATEGORY's `order` below,
  // since the map's insertion order otherwise just reflects whichever
  // sous-catégorie happened to appear first in the query).
  const byCategory = new Map<number, { order: number; nav: CategoryNav }>()
  for (const sc of sousCategoriesResult.docs) {
    const category: Category | number | null | undefined = sc.category
    if (!isDoc<Category>(category)) continue // unresolved/deleted parent — skip defensively
    let bucket = byCategory.get(category.id)
    if (!bucket) {
      bucket = { order: category.order ?? 0, nav: { id: category.id, name: category.name, sousCategories: [] } }
      byCategory.set(category.id, bucket)
    }
    bucket.nav.sousCategories.push({ id: sc.id, name: sc.name, slug: sc.slug ?? '' })
  }
  const categories: CategoryNav[] = [...byCategory.values()].sort((a, b) => a.order - b.order).map((b) => b.nav)

  const contactData: ContactData = {
    facebook: contact.facebook ?? null,
    instagram: contact.instagram ?? null,
    phone: contact.phone ?? null,
    email: contact.email ?? null,
  }

  return (
    <HeaderClient
      locale={locale}
      categories={categories}
      contact={contactData}
      logo={logo}
      brandName={brandName}
    />
  )
}
