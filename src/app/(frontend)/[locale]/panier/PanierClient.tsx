'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { formatPriceTND } from '@/lib/price'
import { useCart } from '@/lib/cart/CartContext'
import { useAuth } from '@/lib/auth/AuthContext'

type DeliveryFee = { governorate: string; feeTND: number }

export default function PanierClient({
  locale,
  deliveryFees,
  freeDeliveryThresholdTND,
}: {
  locale: Locale
  deliveryFees: DeliveryFee[]
  freeDeliveryThresholdTND: number | null
}) {
  const nav = getNavDict(locale)
  const { items, setQty, removeLine, subtotalTND } = useCart()
  const { customer } = useAuth()
  const [governorate, setGovernorate] = useState('')

  const subtotalMillimes = Math.round(subtotalTND * 1000)

  const selectedFee = deliveryFees.find((f) => f.governorate === governorate) ?? null
  const freeThresholdMillimes =
    freeDeliveryThresholdTND != null ? Math.round(freeDeliveryThresholdTND * 1000) : null
  const isFreeDelivery = freeThresholdMillimes != null && subtotalMillimes >= freeThresholdMillimes

  const deliveryMillimes = useMemo(() => {
    if (!governorate) return null // not chosen yet
    if (isFreeDelivery) return 0
    return selectedFee ? Math.round(selectedFee.feeTND * 1000) : null
  }, [governorate, isFreeDelivery, selectedFee])

  const totalMillimes = subtotalMillimes + (deliveryMillimes ?? 0)

  const checkoutHref = customer
    ? paths.commande(locale)
    : `${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.commande(locale))}`

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-lg text-muted">{nav.panierVide}</p>
        <Link
          href={paths.produits(locale)}
          className="mt-6 inline-block rounded-full border border-glaze bg-transparent px-7 py-3 text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none"
        >
          {nav.voirLesProduits}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
      <h1 className="font-display text-3xl text-ink">{nav.panier}</h1>

      <ul className="mt-10 flex flex-col gap-6">
        {items.map((line) => {
          const href =
            line.itemType === 'set' ? paths.ensemble(locale, line.slug) : paths.produit(locale, line.slug)
          const lineTotal = (Math.round(line.priceTND * 1000) * line.qty) / 1000
          const wasCapped = line.qty >= line.maxStock && line.maxStock > 0

          return (
            <li key={line.lineId} className="flex gap-4 border-b border-line pb-6 sm:gap-6">
              <Link
                href={href}
                className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-28"
              >
                {line.image && (
                  <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link href={href} className="font-display text-lg text-ink hover:text-glaze-deep">
                    {line.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeLine(line.lineId)}
                    className="shrink-0 rounded-sm text-sm text-muted hover:text-rim-brown"
                  >
                    {nav.retirer}
                  </button>
                </div>

                <div className="text-sm text-glaze">{formatPriceTND(line.priceTND)}</div>

                <div className="mt-1 flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
                    <button
                      type="button"
                      aria-label={nav.diminuerQuantite}
                      onClick={() => setQty(line.lineId, line.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-base"
                    >
                      −
                    </button>
                    <span aria-live="polite" className="w-6 text-center tabular-nums">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label={nav.augmenterQuantite}
                      disabled={line.qty >= line.maxStock}
                      onClick={() => setQty(line.lineId, line.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-base disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-medium text-ink">{formatPriceTND(lineTotal)}</span>
                </div>

                {wasCapped && <p className="text-xs text-rim-brown">{nav.quantiteLimiteeParStock}</p>}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-10 ms-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-line bg-surface/40 p-7">
        <div>
          <label htmlFor="governorate" className="text-sm text-muted">
            {nav.choisirGouvernorat}
          </label>
          <select
            id="governorate"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-paper/60 px-4 py-2.5 text-ink transition-colors focus:border-glaze motion-reduce:transition-none"
          >
            <option value="">—</option>
            {deliveryFees.map((fee) => (
              <option key={fee.governorate} value={fee.governorate}>
                {fee.governorate}
              </option>
            ))}
          </select>
        </div>

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{nav.sousTotal}</dt>
            <dd className="text-ink">{formatPriceTND(subtotalMillimes / 1000)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{nav.livraison}</dt>
            <dd className="text-ink">
              {deliveryMillimes === null
                ? nav.fraisCalculesEtapeSuivante
                : deliveryMillimes === 0
                  ? nav.livraisonOfferte
                  : formatPriceTND(deliveryMillimes / 1000)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-medium">
            <dt className="text-ink">{nav.total}</dt>
            <dd className="text-ink">{formatPriceTND(totalMillimes / 1000)}</dd>
          </div>
        </dl>

        <Link
          href={checkoutHref}
          className="mt-2 rounded-full border border-glaze bg-transparent px-7 py-3 text-center text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-glaze hover:text-paper motion-reduce:transition-none"
        >
          {nav.passerLaCommande}
        </Link>
      </div>
    </div>
  )
}
