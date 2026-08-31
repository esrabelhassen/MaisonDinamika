'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveCartLines } from './resolveLines'
import type { CartLineInput, CheckoutPreview } from './resolveLines'

/**
 * Read-only. What the checkout page calls on mount (and whenever the governorate
 * changes) to get an authoritative, live-priced preview — never writes anything.
 */
export async function validateCart(
  lines: CartLineInput[],
  governorate: string | null,
): Promise<CheckoutPreview> {
  const payload = await getPayload({ config })
  return resolveCartLines(payload, lines, governorate)
}
