import { redirect, notFound } from 'next/navigation'
import { isValidLocale, getNavDict, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import ProfilClient from '@/components/account/ProfilClient'

export default async function ProfilPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const customer = await getCustomer()
  if (!customer) redirect(`${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.compteProfil(locale))}`)

  const nav = getNavDict(locale)

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{nav.monProfil}</h1>
      <div className="mt-8">
        <ProfilClient
          locale={locale}
          initialFullName={customer.fullName}
          initialPhone={customer.phone}
          email={customer.email}
        />
      </div>
    </div>
  )
}
