export type CartItemType = 'product' | 'set'

export type CartLineItem = {
  lineId: string
  itemType: CartItemType
  /** Payload doc id — re-validate price/stock/status against this at checkout time. */
  id: number
  slug: string
  /** Snapshots at add-time — the cart must still render sanely if the doc changes later. */
  name: string
  priceTND: number
  image: string | null
  qty: number
  maxStock: number
}

export type PersistedCart = {
  version: 1
  items: CartLineItem[]
}
