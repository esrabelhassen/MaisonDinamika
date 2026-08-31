import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { isValidLocale } from '@/lib/i18n'
import PanierClient from './PanierClient'

export default async function PanierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const payload = await getPayload({ config })
  const siteSettings = await payload.findGlobal({
    slug: 'site-settings',
    locale,
    overrideAccess: false,
  })

  const deliveryFees = (siteSettings.deliveryFees ?? []).map((fee) => ({
    governorate: fee.governorate,
    feeTND: fee.feeTND,
  }))

  return (
    <PanierClient
      locale={locale}
      deliveryFees={deliveryFees}
      freeDeliveryThresholdTND={siteSettings.freeDeliveryThresholdTND ?? null}
    />
  )
}
