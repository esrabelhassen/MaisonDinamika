import { redirect, notFound } from 'next/navigation'
import { isValidLocale, getNavDict, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import AddressesClient from '@/components/account/AddressesClient'

export default async function AdressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const customer = await getCustomer()
  if (!customer) redirect(`${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.compteAdresses(locale))}`)

  const nav = getNavDict(locale)

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{nav.mesAdresses}</h1>
      <div className="mt-8">
        <AddressesClient locale={locale} initialAddresses={customer.addresses ?? []} />
      </div>
    </div>
  )
}
