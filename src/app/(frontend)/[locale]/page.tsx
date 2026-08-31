import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { isValidLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { getNavDict } from '@/lib/i18n'
import Hero from '@/components/hero/Hero'
import Nouveaute from '@/components/home/Nouveaute'
import type { NouveauteItem } from '@/components/home/Nouveaute'
import type { Product, Set } from '@/payload-types'
import { toCatalogItem } from '@/lib/queries'

async function getNouveauteItems(
  payload: Awaited<ReturnType<typeof getPayload>>,
  locale: Locale,
  mode: 'auto' | 'manual' | null | undefined,
  manualPicks: { relationTo: 'products' | 'sets'; value: number | Product | Set }[] | null | undefined,
  limit: number,
): Promise<NouveauteItem[]> {
  if (mode === 'manual') {
    return (manualPicks ?? [])
      .filter((pick): pick is typeof pick & { value: Product | Set } => typeof pick.value === 'object')
      .filter((pick) => pick.value.status === 'published')
      .slice(0, limit)
      .map((pick) => toCatalogItem(pick.relationTo === 'sets' ? 'set' : 'product', pick.value))
  }

  // auto: everything flagged isNew + published, products then sets, capped at `limit`.
  const [products, sets] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { isNew: { equals: true }, status: { equals: 'published' } },
      locale,
      depth: 2,
      limit,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'sets',
      where: { isNew: { equals: true }, status: { equals: 'published' } },
      locale,
      depth: 2,
      limit,
      overrideAccess: false,
    }),
  ])

  return [...products.docs.map((p) => toCatalogItem('product', p)), ...sets.docs.map((s) => toCatalogItem('set', s))].slice(
    0,
    limit,
  )
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const payload = await getPayload({ config })
  const nav = getNavDict(locale)

  const homepage = await payload.findGlobal({
    slug: 'homepage',
    locale,
    depth: 2,
    overrideAccess: false,
  })

  const nouveauteItems = await getNouveauteItems(
    payload,
    locale,
    homepage.nouveaute?.mode,
    homepage.nouveaute?.products,
    homepage.nouveaute?.limit ?? 8,
  )

  return (
    <>
      <Hero
        locale={locale}
        eyebrow={homepage.hero?.eyebrow}
        headline={homepage.hero?.headline}
        sub={homepage.hero?.sub}
        ctaLabel={homepage.hero?.ctaLabel}
        ctaLink={homepage.hero?.ctaLink}
      />
      <Nouveaute
        locale={locale}
        heading={homepage.nouveaute?.heading}
        items={nouveauteItems}
        ensembleLabel={nav.ensemble}
      />
    </>
  )
}
