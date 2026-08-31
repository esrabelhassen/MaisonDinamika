import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'
import type { Product, Set } from '@/payload-types'
import { resolveLogo } from '@/lib/media'
import HeaderClient from './HeaderClient'
import type { CategoryNav, ContactData } from './types'

function isDoc<T>(value: T | number | null | undefined): value is T {
  return typeof value === 'object' && value !== null
}

export default async function Header({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })

  const [categoriesResult, contact, settings] = await Promise.all([
    // depth: 2 populates each category's `products`/`sets` relationships with the
    // full documents (not just ids) so the mega-panel can render names/slugs
    // directly, no extra round trip.
    payload.find({
      collection: 'categories',
      sort: 'order',
      depth: 2,
      locale,
      limit: 100,
      // No `user` here — this runs as an anonymous storefront visitor, so
      // overrideAccess: false enforces each collection's own public rules
      // (Products/Sets already restrict to status: published for anonymous reads).
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

  const categories: CategoryNav[] = categoriesResult.docs.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug ?? '',
    products: (category.products ?? [])
      .filter((product): product is Product => isDoc<Product>(product))
      .map((product) => ({ id: product.id, name: product.name, slug: product.slug ?? '' })),
    sets: (category.sets ?? [])
      .filter((set): set is Set => isDoc<Set>(set))
      .map((set) => ({ id: set.id, name: set.name, slug: set.slug ?? '' })),
  }))

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
