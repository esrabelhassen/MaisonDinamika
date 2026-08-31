'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CART_STORAGE_KEY, readCart, writeCart } from './storage'
import type { CartItemType, CartLineItem } from './types'

export type AddItemInput = {
  itemType: CartItemType
  id: number
  slug: string
  name: string
  priceTND: number
  image: string | null
  maxStock: number
  /** How many to add (defaults to 1) — NOT the resulting line quantity when merging. */
  qty?: number
}

type CartContextValue = {
  items: CartLineItem[]
  /** Sum of quantities across all lines — what the header badge shows. */
  count: number
  subtotalTND: number
  addItem: (input: AddItemInput) => void
  removeLine: (lineId: string) => void
  setQty: (lineId: string, qty: number) => void
  clear: () => void
  /** False until the post-mount localStorage read has completed. */
  hydrated: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

function lineIdFor(itemType: CartItemType, id: number) {
  return `${itemType}:${id}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Always starts empty on both server and first client render — localStorage is
  // only ever touched in an effect, after mount, so there's nothing to mismatch
  // during hydration.
  const [items, setItems] = useState<CartLineItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Don't persist until we've actually read once — otherwise this fires with the
    // initial empty state and clobbers whatever was already saved.
    if (!hydrated) return
    writeCart(items)
  }, [items, hydrated])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY) return
      setItems(readCart())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addItem = useCallback((input: AddItemInput) => {
    setItems((prev) => {
      const lineId = lineIdFor(input.itemType, input.id)
      const addQty = input.qty ?? 1
      const existing = prev.find((line) => line.lineId === lineId)

      if (existing) {
        const nextQty = Math.min(existing.maxStock, existing.qty + addQty)
        return prev.map((line) => (line.lineId === lineId ? { ...line, qty: nextQty } : line))
      }

      const qty = Math.min(Math.max(1, addQty), input.maxStock)
      if (qty <= 0) return prev // maxStock <= 0 — nothing to add (UI should already block this)

      const newLine: CartLineItem = {
        lineId,
        itemType: input.itemType,
        id: input.id,
        slug: input.slug,
        name: input.name,
        priceTND: input.priceTND,
        image: input.image,
        maxStock: input.maxStock,
        qty,
      }
      return [...prev, newLine]
    })
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((line) => line.lineId !== lineId))
  }, [])

  const setQty = useCallback((lineId: string, qty: number) => {
    setItems((prev) =>
      prev.map((line) =>
        line.lineId === lineId ? { ...line, qty: Math.min(Math.max(1, qty), line.maxStock) } : line,
      ),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((sum, line) => sum + line.qty, 0), [items])

  // Integer-millime arithmetic: never sum floating-point dinars directly.
  const subtotalTND = useMemo(
    () => items.reduce((sumMillimes, line) => sumMillimes + Math.round(line.priceTND * 1000) * line.qty, 0) / 1000,
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotalTND, addItem, removeLine, setQty, clear, hydrated }),
    [items, count, subtotalTND, addItem, removeLine, setQty, clear, hydrated],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>')
  return ctx
}
