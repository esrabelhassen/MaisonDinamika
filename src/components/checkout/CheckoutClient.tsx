'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { formatPriceTND } from '@/lib/price'
import { governorates } from '@/lib/governorates'
import { useCart } from '@/lib/cart/CartContext'
import { validateCart } from '@/lib/checkout/validateCart'
import { placeOrder } from '@/lib/checkout/placeOrder'
import type { CheckoutPreview } from '@/lib/checkout/resolveLines'
import type { CartLineItem } from '@/lib/cart/types'
import Field from '@/components/form/Field'

export type CheckoutPrefill = {
  fullName: string
  phone: string
  line1: string
  city: string
  governorate: string
}

type FieldErrors = {
  fullName?: string
  phone?: string
  line1?: string
  city?: string
  governorate?: string
}

/** Dynamic, per-line drift messages — genuinely interpolated content, not a fixed
 * label, so kept as inline FR templates rather than forced into the static dict. */
function buildDriftMessages(cartItems: CartLineItem[], preview: CheckoutPreview): string[] {
  const messages: string[] = []
  for (const r of preview.report) {
    const cartLine = cartItems.find((c) => c.itemType === r.itemType && c.id === r.id)
    const label = cartLine?.name ?? r.name ?? '—'
    if (!r.found || r.outOfStock) {
      messages.push(`${label} n’est plus disponible et a été retiré du panier.`)
      continue
    }
    if (r.priceChanged && r.livePriceTND != null) {
      messages.push(`Le prix de ${label} est passé à ${formatPriceTND(r.livePriceTND)}.`)
    }
    if (r.stockCapped) {
      messages.push(`Stock limité pour ${label} : quantité ajustée à ${r.finalQty}.`)
    }
  }
  return messages
}

export default function CheckoutClient({ locale, prefill }: { locale: Locale; prefill: CheckoutPrefill }) {
  const nav = getNavDict(locale)
  const router = useRouter()
  const { items, removeLine, addItem, clear, hydrated } = useCart()

  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [driftMessages, setDriftMessages] = useState<string[]>([])
  const [reviewed, setReviewed] = useState(true)
  const [validating, setValidating] = useState(true)
  const hasValidatedOnce = useRef(false)

  const [fullName, setFullName] = useState(prefill.fullName)
  const [phone, setPhone] = useState(prefill.phone)
  const [line1, setLine1] = useState(prefill.line1)
  const [city, setCity] = useState(prefill.city)
  const [governorate, setGovernorate] = useState(prefill.governorate)
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  // Guards against a real race: a successful order calls clear(), which makes
  // `items` empty WHILE this page is still mounted (router.push to the confirmation
  // route hasn't swapped the page out yet) — without this flag, the "empty cart"
  // effect below fires first and redirects to /panier, clobbering the navigation to
  // the confirmation page that was already in flight.
  const orderPlacedRef = useRef(false)

  // Empty cart -> nothing to check out. Gated on `hydrated` so we never redirect
  // based on the transient pre-hydration empty state of a cart that actually has
  // items in localStorage.
  useEffect(() => {
    if (hydrated && items.length === 0 && !orderPlacedRef.current) router.replace(paths.panier(locale))
  }, [hydrated, items.length, locale, router])

  const runValidation = useCallback(
    async (gov: string, currentItems: CartLineItem[]) => {
      setValidating(true)
      const lines = currentItems.map((i) => ({
        itemType: i.itemType,
        id: i.id,
        qty: i.qty,
        clientPriceTND: i.priceTND,
      }))
      const result = await validateCart(lines, gov || null)
      setPreview(result)

      for (const r of result.report) {
        const cartLine = currentItems.find((i) => i.itemType === r.itemType && i.id === r.id)
        if (!cartLine) continue
        if (!r.found || r.outOfStock) {
          removeLine(cartLine.lineId)
        } else if (r.finalQty > 0) {
          // Resync the FULL snapshot (price/name/image/maxStock), not just qty —
          // otherwise a price-drift line's stale cached price never catches up, so
          // every later revalidation (e.g. on governorate change) sees the same
          // "drift" again and permanently re-blocks the submit button. removeLine +
          // addItem is a clean full replace using the existing cart API (no new
          // context method needed): addItem on a freshly-removed line just creates
          // it with exactly `qty: finalQty` (nothing left to merge with).
          removeLine(cartLine.lineId)
          addItem({
            itemType: r.itemType,
            id: r.id,
            slug: r.slug ?? cartLine.slug,
            name: r.name ?? cartLine.name,
            priceTND: r.livePriceTND ?? cartLine.priceTND,
            image: r.image,
            maxStock: r.liveStock ?? cartLine.maxStock,
            qty: r.finalQty,
          })
        }
      }

      const messages = buildDriftMessages(currentItems, result)
      setDriftMessages(messages)
      if (result.hasIssues) setReviewed(false)
      setValidating(false)
    },
    [removeLine, addItem],
  )

  // Validate exactly once, as soon as the cart has hydrated — NOT on every `items`
  // change, since runValidation's own corrections change `items` and would loop.
  useEffect(() => {
    if (!hydrated || hasValidatedOnce.current || items.length === 0) return
    hasValidatedOnce.current = true
    void runValidation(governorate, items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  function handleGovernorateChange(value: string) {
    setGovernorate(value)
    void runValidation(value, items)
  }

  function validateFields(): FieldErrors {
    const next: FieldErrors = {}
    if (!fullName.trim()) next.fullName = nav.champRequis
    if (!phone.trim()) next.phone = nav.champRequis
    if (!line1.trim()) next.line1 = nav.champRequis
    if (!city.trim()) next.city = nav.champRequis
    if (!governorate) next.governorate = nav.champRequis
    return next
  }

  const feeUnavailable = !!governorate && preview != null && preview.deliveryMillimes == null
  const canSubmit =
    !!preview &&
    preview.orderableLines.length > 0 &&
    !feeUnavailable &&
    (!preview.hasIssues || reviewed) &&
    !validating &&
    !submitting

  async function handleSubmit() {
    if (submittingRef.current) return
    const nextErrors = validateFields()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (!canSubmit || !preview) return

    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)

    try {
      const lines = preview.orderableLines.map((l) => ({ itemType: l.itemType, id: l.id, qty: l.qty }))
      const result = await placeOrder({
        lines,
        governorate,
        shippingAddress: { fullName, phone, line1, city },
        notes: notes.trim() || undefined,
      })

      if (result.ok) {
        orderPlacedRef.current = true
        clear()
        router.push(paths.confirmation(locale, result.orderNumber))
        return
      }

      if (result.reason === 'invalid-cart') {
        setPreview(result.preview)
        setDriftMessages(buildDriftMessages(items, result.preview))
        setReviewed(false)
        setFormError(nav.changementsDetectes)
      } else if (result.reason === 'unauthenticated') {
        router.push(`${paths.connexion(locale)}?redirect=${encodeURIComponent(paths.commande(locale))}`)
      } else {
        setFormError(nav.erreurGenerique)
      }
    } catch {
      setFormError(nav.erreurGenerique)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleSubmit()
    }
  }

  if (items.length === 0) return null

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">{nav.commandeTitre}</h1>

      {driftMessages.length > 0 && (
        <div role="alert" className="mt-6 rounded-lg border border-rim-brown/30 bg-rim-brown/10 px-4 py-3 text-sm text-rim-brown">
          <p className="font-medium">{nav.changementsDetectes}</p>
          <ul className="mt-1.5 list-inside list-disc">
            {driftMessages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          {!reviewed && (
            <button
              type="button"
              onClick={() => setReviewed(true)}
              className="mt-3 rounded-full bg-ink px-5 py-2 text-xs text-paper hover:bg-glaze-deep"
            >
              {nav.jaiVuContinuer}
            </button>
          )}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="font-display text-xl text-ink">{nav.adresseLivraison}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="fullName" label={nav.nomComplet} value={fullName} onChange={setFullName} error={fieldErrors.fullName} onKeyDown={handleKeyDown} disabled={submitting} />
              <Field id="phone" label={nav.telephone} value={phone} onChange={setPhone} error={fieldErrors.phone} onKeyDown={handleKeyDown} disabled={submitting} type="tel" />
              <Field id="line1" label={nav.ligne1} value={line1} onChange={setLine1} error={fieldErrors.line1} onKeyDown={handleKeyDown} disabled={submitting} className="sm:col-span-2" />
              <Field id="city" label={nav.ville} value={city} onChange={setCity} error={fieldErrors.city} onKeyDown={handleKeyDown} disabled={submitting} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="governorate" className="text-sm text-muted">
                  {nav.gouvernorat}
                </label>
                <select
                  id="governorate"
                  value={governorate}
                  disabled={submitting}
                  onChange={(e) => handleGovernorateChange(e.target.value)}
                  aria-invalid={!!fieldErrors.governorate}
                  className="rounded-lg border border-glaze-light bg-white/60 px-4 py-2.5 text-ink disabled:opacity-60"
                >
                  <option value="">—</option>
                  {governorates.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.governorate && <p className="text-sm text-rim-brown">{fieldErrors.governorate}</p>}
                {feeUnavailable && <p className="text-sm text-rim-brown">{nav.fraisNonDisponibles}</p>}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-sm text-muted">
                {nav.notesOptionnelles}
              </label>
              <textarea
                id="notes"
                value={notes}
                disabled={submitting}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-lg border border-glaze-light bg-white/60 px-4 py-2.5 text-ink disabled:opacity-60"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-glaze-light bg-glaze-light/30 p-5 text-sm text-ink">
            {nav.paiementLivraisonNotice}
          </section>

          {formError && (
            <p role="alert" className="rounded-lg bg-rim-brown/10 px-4 py-3 text-sm text-rim-brown">
              {formError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="self-start rounded-full bg-ink px-8 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            {submitting ? nav.commandeEnCours : nav.confirmerLaCommande}
          </button>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-glaze-light p-6">
          <h2 className="font-display text-xl text-ink">{nav.recapitulatif}</h2>

          {!preview ? (
            <p className="text-sm text-muted">…</p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {preview.orderableLines.map((line) => {
                  const href = line.itemType === 'set' ? paths.ensemble(locale, line.slug) : paths.produit(locale, line.slug)
                  return (
                    <li key={`${line.itemType}-${line.id}`} className="flex items-center gap-3">
                      <Link href={href} className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-glaze-light">
                        {line.image && <Image src={line.image} alt={line.name} fill sizes="48px" className="object-cover" />}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={href} className="block truncate text-sm text-ink hover:text-glaze-deep">
                          {line.name}
                        </Link>
                        <div className="text-xs text-muted">
                          {nav.quantiteAbbr} {line.qty}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm text-ink">
                        {formatPriceTND((Math.round(line.priceTND * 1000) * line.qty) / 1000)}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <dl className="flex flex-col gap-2 border-t border-glaze-light pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{nav.sousTotal}</dt>
                  <dd className="text-ink">{formatPriceTND(preview.subtotalMillimes / 1000)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{nav.livraison}</dt>
                  <dd className="text-ink">
                    {preview.deliveryMillimes == null
                      ? nav.fraisCalculesEtapeSuivante
                      : preview.deliveryMillimes === 0
                        ? nav.livraisonOfferte
                        : formatPriceTND(preview.deliveryMillimes / 1000)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-glaze-light pt-2 font-medium">
                  <dt className="text-ink">{nav.total}</dt>
                  <dd className="text-ink">{formatPriceTND(preview.totalMillimes / 1000)}</dd>
                </div>
              </dl>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
