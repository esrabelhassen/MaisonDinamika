import type { BasePayload } from 'payload'
import { firstCardImage } from '@/lib/media'

export type CartLineInput = {
  itemType: 'product' | 'set'
  id: number
  qty: number
  /** Client's cached price, for price-drift detection ONLY — never used to price anything. */
  clientPriceTND?: number
}

export type LineReport = {
  itemType: 'product' | 'set'
  id: number
  /** False = doc missing or unpublished — the client's own cached name is used for
   * messaging in this case, since we have no live data to offer. */
  found: boolean
  name: string | null
  slug: string | null
  image: string | null
  livePriceTND: number | null
  liveStock: number | null
  requestedQty: number
  /** What the line should actually become: 0 if dropped (removed or out of stock). */
  finalQty: number
  priceChanged: boolean
  stockCapped: boolean
  outOfStock: boolean
}

export type OrderableLine = {
  itemType: 'product' | 'set'
  id: number
  name: string
  slug: string
  image: string | null
  priceTND: number
  qty: number
  maxStock: number
}

export type CheckoutPreview = {
  report: LineReport[]
  orderableLines: OrderableLine[]
  subtotalMillimes: number
  /** null = no governorate chosen yet, so no fee can be quoted. */
  deliveryMillimes: number | null
  isFreeDelivery: boolean
  totalMillimes: number
  hasIssues: boolean
}

function priceDiffers(clientPriceTND: number | undefined, livePriceTND: number): boolean {
  if (clientPriceTND == null) return false
  return Math.round(clientPriceTND * 1000) !== Math.round(livePriceTND * 1000)
}

/**
 * The single authoritative resolver: given the client's (untrusted) cart lines, looks
 * up LIVE published data for each and reports what changed. Read-only — callers
 * decide what to do with the report (validateCart just returns it; placeOrder uses it
 * to decide whether it's safe to write).
 */
export async function resolveCartLines(
  payload: BasePayload,
  lines: CartLineInput[],
  governorate: string | null,
): Promise<CheckoutPreview> {
  const report: LineReport[] = await Promise.all(
    lines.map(async (line): Promise<LineReport> => {
      const doc = await payload
        .findByID({
          collection: line.itemType === 'set' ? 'sets' : 'products',
          id: line.id,
          depth: 1,
          overrideAccess: false, // published-only, same rule for every visitor — customer or not
          disableErrors: true,
        })
        .catch(() => null)

      if (!doc) {
        return {
          itemType: line.itemType,
          id: line.id,
          found: false,
          name: null,
          slug: null,
          image: null,
          livePriceTND: null,
          liveStock: null,
          requestedQty: line.qty,
          finalQty: 0,
          priceChanged: false,
          stockCapped: false,
          outOfStock: false,
        }
      }

      const liveStock = doc.stock ?? 0
      const finalQty = Math.min(line.qty, Math.max(0, liveStock))
      const image = firstCardImage(doc.images, doc.name)

      return {
        itemType: line.itemType,
        id: line.id,
        found: true,
        name: doc.name,
        slug: doc.slug ?? '',
        image: image?.url ?? null,
        livePriceTND: doc.priceTND,
        liveStock,
        requestedQty: line.qty,
        finalQty,
        priceChanged: priceDiffers(line.clientPriceTND, doc.priceTND),
        stockCapped: liveStock > 0 && finalQty < line.qty,
        outOfStock: liveStock <= 0,
      }
    }),
  )

  const orderableLines: OrderableLine[] = report
    .filter((r) => r.finalQty > 0)
    .map((r) => ({
      itemType: r.itemType,
      id: r.id,
      name: r.name as string,
      slug: r.slug as string,
      image: r.image,
      priceTND: r.livePriceTND as number,
      qty: r.finalQty,
      maxStock: r.liveStock as number,
    }))

  const subtotalMillimes = orderableLines.reduce(
    (sum, line) => sum + Math.round(line.priceTND * 1000) * line.qty,
    0,
  )

  const siteSettings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
  const thresholdMillimes =
    siteSettings.freeDeliveryThresholdTND != null
      ? Math.round(siteSettings.freeDeliveryThresholdTND * 1000)
      : null
  const isFreeDelivery = thresholdMillimes != null && subtotalMillimes >= thresholdMillimes

  const feeEntry = governorate
    ? (siteSettings.deliveryFees ?? []).find((f) => f.governorate === governorate)
    : null
  const deliveryMillimes = !governorate
    ? null
    : isFreeDelivery
      ? 0
      : feeEntry
        ? Math.round(feeEntry.feeTND * 1000)
        : null

  const totalMillimes = subtotalMillimes + (deliveryMillimes ?? 0)

  const hasIssues = report.some((r) => !r.found || r.outOfStock || r.stockCapped || r.priceChanged)

  return { report, orderableLines, subtotalMillimes, deliveryMillimes, isFreeDelivery, totalMillimes, hasIssues }
}
