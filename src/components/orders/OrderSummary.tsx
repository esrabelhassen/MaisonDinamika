import type { Locale } from '@/lib/i18n'
import { getNavDict } from '@/lib/i18n'
import { formatPriceTND } from '@/lib/price'

export type OrderSummaryLine = {
  id?: string | null
  nameSnapshot: string
  unitPriceTND: number
  qty: number
}

export type OrderSummaryAddress = {
  fullName?: string | null
  line1?: string | null
  city?: string | null
  phone?: string | null
}

export type OrderSummaryData = {
  items?: OrderSummaryLine[] | null
  subtotalTND?: number | null
  deliveryFeeTND?: number | null
  totalTND?: number | null
  shippingAddress?: OrderSummaryAddress | null
  governorate: string
}

// The record-of-a-past-order view — shared verbatim between the just-placed
// confirmation page and the account order-detail page. Always renders the STORED
// order exactly as-is; never recomputes anything from live product/set data.
export default function OrderSummary({ locale, order }: { locale: Locale; order: OrderSummaryData }) {
  const nav = getNavDict(locale)

  return (
    <>
      <section>
        <h2 className="font-display text-xl text-ink">{nav.recapitulatif}</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {(order.items ?? []).map((line, i) => (
            <li key={line.id ?? i} className="flex justify-between gap-3 border-b border-line pb-3 text-sm">
              <div>
                <div className="text-ink">{line.nameSnapshot}</div>
                <div className="text-muted">
                  {nav.quantiteAbbr} {line.qty} × {formatPriceTND(line.unitPriceTND)}
                </div>
              </div>
              <div className="shrink-0 text-ink">
                {formatPriceTND((Math.round(line.unitPriceTND * 1000) * line.qty) / 1000)}
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{nav.sousTotal}</dt>
            <dd className="text-ink">{formatPriceTND(order.subtotalTND ?? 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{nav.livraison}</dt>
            <dd className="text-ink">
              {order.deliveryFeeTND === 0 ? nav.livraisonOfferte : formatPriceTND(order.deliveryFeeTND ?? 0)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-medium">
            <dt className="text-ink">{nav.total}</dt>
            <dd className="text-ink">{formatPriceTND(order.totalTND ?? 0)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">{nav.adresseLivraison}</h2>
        <p className="mt-3 text-sm text-muted">
          {order.shippingAddress?.fullName}
          <br />
          {order.shippingAddress?.line1}, {order.shippingAddress?.city}
          <br />
          {order.governorate}
          <br />
          {order.shippingAddress?.phone}
        </p>
      </section>
    </>
  )
}
