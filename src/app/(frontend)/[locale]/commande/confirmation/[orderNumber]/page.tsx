import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidLocale, getNavDict, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import OrderSummary from '@/components/orders/OrderSummary'

export const metadata = {
  robots: { index: false, follow: false },
}

const STATUS_LABEL_KEYS = {
  placee: 'statutPlacee',
  confirmee: 'statutConfirmee',
  expediee: 'statutExpediee',
  livree: 'statutLivree',
  retournee: 'statutRetournee',
  annulee: 'statutAnnulee',
} as const

type Params = { locale: string; orderNumber: string }

export default async function ConfirmationPage({ params }: { params: Promise<Params> }) {
  const { locale, orderNumber } = await params
  if (!isValidLocale(locale)) notFound()

  const nav = getNavDict(locale)

  // No session -> nothing can belong to them -> same outcome as "not found", per spec.
  const customer = await getCustomer()
  if (!customer) notFound()

  const payload = await getPayload({ config })
  // Passing `user: customer` is what makes Orders' own row-level access control
  // (`{ customer: { equals: user.id } }`) apply — a different customer's order
  // simply won't be in `docs`, so the ownership check below is defense in depth,
  // not the primary enforcement.
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
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <p className="text-sm text-glaze">{nav.numeroDeCommande}</p>
      <h1 className="font-display text-3xl text-ink">{order.orderNumber}</h1>

      {statusKey && (
        <p className="mt-2 text-sm text-muted">
          {nav.statut} : <span className="text-ink">{nav[statusKey]}</span>
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-5 text-sm text-ink">
        {nav.paiementLivraisonConfirmation}
      </div>

      <div className="mt-10">
        <OrderSummary locale={locale} order={order} />
      </div>

      <p className="mt-8 text-sm text-glaze">{nav.paiementLivraison}</p>

      <Link
        href={paths.produits(locale)}
        className="mt-8 inline-block rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none"
      >
        {nav.voirLesProduits}
      </Link>
    </div>
  )
}
