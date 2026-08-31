import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidLocale, getNavDict, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import OrderSummary from '@/components/orders/OrderSummary'

const STATUS_LABEL_KEYS = {
  placee: 'statutPlacee',
  confirmee: 'statutConfirmee',
  expediee: 'statutExpediee',
  livree: 'statutLivree',
  retournee: 'statutRetournee',
  annulee: 'statutAnnulee',
} as const

const dateFormatter = new Intl.DateTimeFormat('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })

type Params = { locale: string; orderNumber: string }

export default async function CompteCommandePage({ params }: { params: Promise<Params> }) {
  const { locale, orderNumber } = await params
  if (!isValidLocale(locale)) notFound()

  const customer = await getCustomer()
  if (!customer) redirect(`${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.compte(locale))}`)

  const nav = getNavDict(locale)
  const payload = await getPayload({ config })
  // Same pattern as the confirmation page: user:customer + overrideAccess:false makes
  // Orders' own access control the real enforcement — a foreign orderNumber just
  // won't be in `docs`. The explicit id check below is defense in depth.
  const { docs } = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: orderNumber } },
    user: customer,
    overrideAccess: false,
    depth: 0,
    limit: 1,
  })

  const order = docs[0]
  if (!order) notFound()
  const orderCustomerId = typeof order.customer === 'object' ? order.customer.id : order.customer
  if (orderCustomerId !== customer.id) notFound()

  const statusKey = order.status ? STATUS_LABEL_KEYS[order.status] : null

  return (
    <div>
      <p className="text-sm text-glaze">{nav.numeroDeCommande}</p>
      <h1 className="font-display text-3xl text-ink">{order.orderNumber}</h1>
      <p className="mt-2 text-sm text-muted">
        {dateFormatter.format(new Date(order.createdAt))}
        {statusKey && (
          <>
            {' — '}
            {nav.statut} : <span className="text-ink">{nav[statusKey]}</span>
          </>
        )}
      </p>

      <div className="mt-10">
        <OrderSummary locale={locale} order={order} />
      </div>

      <p className="mt-8 text-sm text-glaze">{nav.paiementLivraison}</p>
    </div>
  )
}
