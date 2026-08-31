import { redirect, notFound } from 'next/navigation'
import { isValidLocale, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import CheckoutClient from '@/components/checkout/CheckoutClient'

export default async function CommandePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  // Server-side gate: an anonymous visitor never sees this page render.
  const customer = await getCustomer()
  if (!customer) redirect(`${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.commande(locale))}`)

  const firstAddress = customer.addresses?.[0] ?? null

  return (
    <CheckoutClient
      locale={locale}
      prefill={{
        fullName: customer.fullName,
        phone: customer.phone,
        line1: firstAddress?.line1 ?? '',
        city: firstAddress?.city ?? '',
        governorate: firstAddress?.governorate ?? '',
      }}
    />
  )
}
