import type { CartLineItem, PersistedCart } from './types'

export const CART_STORAGE_KEY = 'md_cart_v1'
const CURRENT_VERSION = 1 as const

function isCartLineItem(value: unknown): value is CartLineItem {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.lineId === 'string' &&
    (v.itemType === 'product' || v.itemType === 'set') &&
    typeof v.id === 'number' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    typeof v.priceTND === 'number' &&
    (v.image === null || typeof v.image === 'string') &&
    typeof v.qty === 'number' &&
    typeof v.maxStock === 'number'
  )
}

/**
 * Reads the cart from localStorage. Fails safe to an empty cart on ANY problem —
 * missing key, corrupt JSON, wrong version, wrong shape — never throws.
 */
export function readCart(): CartLineItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed as PersistedCart).version !== CURRENT_VERSION ||
      !Array.isArray((parsed as PersistedCart).items)
    ) {
      return []
    }
    // Defense in depth: even within a correctly-versioned envelope, drop any
    // individual line that doesn't match the expected shape rather than trusting it.
    return (parsed as PersistedCart).items.filter(isCartLineItem)
  } catch {
    return []
  }
}

export function writeCart(items: CartLineItem[]): void {
  if (typeof window === 'undefined') return
  try {
    const payload: PersistedCart = { version: CURRENT_VERSION, items }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage full or unavailable (e.g. private browsing) — the cart just won't
    // persist this change; the app must keep working regardless.
  }
}
