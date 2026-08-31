'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCustomer } from '@/lib/auth/getCustomer'
import { resolveCartLines } from './resolveLines'
import type { CartLineInput, CheckoutPreview } from './resolveLines'

export type ShippingAddressInput = {
  fullName: string
  phone: string
  line1: string
  city: string
}

export type PlaceOrderInput = {
  lines: CartLineInput[]
  governorate: string
  shippingAddress: ShippingAddressInput
  notes?: string
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; id: number }
  | { ok: false; reason: 'unauthenticated' }
  | { ok: false; reason: 'invalid-address' }
  | { ok: false; reason: 'invalid-cart'; preview: CheckoutPreview }
  | { ok: false; reason: 'server-error' }

function hasBlockingIssues(preview: CheckoutPreview): boolean {
  return preview.report.some((r) => !r.found || r.outOfStock || r.stockCapped) || preview.orderableLines.length === 0
}

/**
 * The write path. Re-authenticates and re-validates from scratch — the client's
 * earlier validateCart() call is never trusted here, only used for the UI preview.
 * Stock decrement + order creation happen inside one DB transaction: any failure
 * (including a stock re-check failing at commit time) rolls back everything written
 * so far in this call — no partial decrements, no orphan order.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, reason: 'unauthenticated' }

  const address = input.shippingAddress
  if (
    !address?.fullName?.trim() ||
    !address?.phone?.trim() ||
    !address?.line1?.trim() ||
    !address?.city?.trim() ||
    !input.governorate
  ) {
    return { ok: false, reason: 'invalid-address' }
  }

  const payload = await getPayload({ config })

  // Step 1: fresh re-validate, outside any transaction — cheap way to bounce an
  // obviously-stale cart (removed/out-of-stock/over-stock lines) before ever opening
  // a transaction. Time passed since the client's own validateCart() call, so this is
  // not optional — it's the real check.
  const preRead = await resolveCartLines(payload, input.lines, input.governorate)
  if (hasBlockingIssues(preRead)) {
    return { ok: false, reason: 'invalid-cart', preview: preRead }
  }

  // Step 2: the write, inside a single transaction.
  const transactionID = await payload.db.beginTransaction()
  if (transactionID == null) return { ok: false, reason: 'server-error' }

  try {
    const orderItems: Array<{
      itemType: 'product' | 'set'
      nameSnapshot: string
      unitPriceTND: number
      qty: number
      product?: number
      set?: number
    }> = []

    for (const line of preRead.orderableLines) {
      const collection = line.itemType === 'set' ? 'sets' : 'products'

      // Re-read INSIDE the transaction — the TOCTOU guard. Time passed since Step 1
      // too (however brief), and this is the number that's actually going to be
      // decremented, so it must be read fresh, in-transaction.
      const liveDoc = await payload.findByID({
        collection,
        id: line.id,
        req: { transactionID },
        overrideAccess: true, // system-trust context — we already authenticated the customer above
      })

      if (!liveDoc || liveDoc.status !== 'published') {
        throw new Error('LINE_REMOVED')
      }
      const liveStock = liveDoc.stock ?? 0
      if (liveStock < line.qty) {
        throw new Error('LINE_STOCK')
      }

      await payload.update({
        collection,
        id: line.id,
        data: { stock: liveStock - line.qty },
        req: { transactionID },
        overrideAccess: true,
      })

      orderItems.push({
        itemType: line.itemType,
        nameSnapshot: liveDoc.name,
        unitPriceTND: liveDoc.priceTND,
        qty: line.qty,
        ...(line.itemType === 'set' ? { set: line.id } : { product: line.id }),
      })
    }

    // customer is ALWAYS the authenticated session's id — never anything from the
    // client payload (PlaceOrderInput doesn't even have a customer field). Totals and
    // deliveryFeeTND are deliberately omitted: the collection's beforeChange hook is
    // the single source of truth for those, computed from these frozen item prices.
    const order = await payload.create({
      collection: 'orders',
      data: {
        customer: customer.id,
        items: orderItems,
        governorate: input.governorate as never,
        // Explicit null, NOT omitted — Payload applies the field's defaultValue (0)
        // to an omitted key before our beforeChange hook ever runs, which would
        // silently skip the SiteSettings fee lookup. An explicit null bypasses that
        // substitution and reaches the hook as null, which is what makes the "fill
        // only when == null" guard actually fire. Verified empirically.
        deliveryFeeTND: null,
        shippingAddress: address,
        notes: input.notes,
        status: 'placee',
        paymentMethod: 'Paiement à la livraison',
      },
      req: { transactionID },
      overrideAccess: true,
    })

    await payload.db.commitTransaction(transactionID)
    return { ok: true, orderNumber: order.orderNumber ?? String(order.id), id: order.id }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)

    if (error instanceof Error && (error.message === 'LINE_REMOVED' || error.message === 'LINE_STOCK')) {
      const freshPreview = await resolveCartLines(payload, input.lines, input.governorate)
      return { ok: false, reason: 'invalid-cart', preview: freshPreview }
    }
    return { ok: false, reason: 'server-error' }
  }
}
