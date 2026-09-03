import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidLocale, getNavDict, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import { formatPriceTND } from '@/lib/price'

const STATUS_LABEL_KEYS = {
  placee: 'statutPlacee',
  confirmee: 'statutConfirmee',
  expediee: 'statutExpediee',
  livree: 'statutLivree',
  retournee: 'statutRetournee',
  annulee: 'statutAnnulee',
} as const

const dateFormatter = new Intl.DateTimeFormat('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default async function ComptePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const customer = await getCustomer()
  if (!customer) redirect(`${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.compte(locale))}`)

  const nav = getNavDict(locale)
  const payload = await getPayload({ config })
  // user:customer + overrideAccess:false -> Orders' own access control scopes this to
  // { customer: { equals: customer.id } } — this can never return another customer's rows.
  const { docs: orders } = await payload.find({
    collection: 'orders',
    user: customer,
    overrideAccess: false,
    sort: '-createdAt',
    depth: 0,
    limit: 100,
  })

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{nav.mesCommandes}</h1>

      {orders.length === 0 ? (
        <div className="mt-8">
          <p className="text-muted">{nav.aucuneCommande}</p>
          <Link
            href={paths.produits(locale)}
            className="mt-4 inline-block rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none"
          >
            {nav.voirLesProduits}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((order) => {
            const statusKey = order.status ? STATUS_LABEL_KEYS[order.status] : null
            return (
              <li key={order.id}>
                <Link
                  href={paths.compteCommande(locale, order.orderNumber ?? String(order.id))}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/40 p-6 transition-colors hover:border-glaze motion-reduce:transition-none"
                >
                  <div>
                    <div className="font-display text-lg text-ink">{order.orderNumber}</div>
                    <div className="text-sm text-muted">
                      {dateFormatter.format(new Date(order.createdAt))}
                      {statusKey && (
                        <span className="ms-2 rounded-sm bg-glaze-light px-1.5 py-0.5 text-xs text-glaze-dark">
                          {nav[statusKey]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-medium text-ink">{formatPriceTND(order.totalTND ?? 0)}</div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
