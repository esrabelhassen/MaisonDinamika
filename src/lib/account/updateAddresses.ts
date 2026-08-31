'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCustomer } from '@/lib/auth/getCustomer'
import { governorates } from '@/lib/governorates'
import type { Customer } from '@/payload-types'

export type AddressInput = {
  label?: string
  line1: string
  city: string
  governorate: string
  phone?: string
}

export type SavedAddress = NonNullable<Customer['addresses']>[number]

export type AddressAction =
  | { type: 'add'; address: AddressInput }
  | { type: 'edit'; index: number; address: AddressInput }
  | { type: 'remove'; index: number }
  | { type: 'setDefault'; index: number }

export type UpdateAddressesResult =
  | { ok: true; addresses: SavedAddress[] }
  | { ok: false; reason: 'unauthenticated' | 'not-found' | 'invalid-address' }

const GOVERNORATE_VALUES = new Set(governorates.map((g) => g.value))

function validateAddress(input: AddressInput): SavedAddress | null {
  if (!input.line1?.trim() || !input.city?.trim() || !input.governorate) return null
  if (!GOVERNORATE_VALUES.has(input.governorate)) return null
  return {
    label: input.label?.trim() || undefined,
    line1: input.line1.trim(),
    city: input.city.trim(),
    governorate: input.governorate as SavedAddress['governorate'],
    phone: input.phone?.trim() || undefined,
  }
}

/**
 * Every branch writes to `customer.id` from the SESSION only — there is no customer
 * id anywhere in AddressAction, so a crafted client payload has no way to target
 * anyone else's record. overrideAccess:false + user:customer still enforces
 * Customers' own adminsOrSelf access control in depth, even though the id is already
 * self-scoped by construction.
 */
export async function updateAddresses(action: AddressAction): Promise<UpdateAddressesResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, reason: 'unauthenticated' }

  const current = customer.addresses ?? []
  let next: SavedAddress[]

  switch (action.type) {
    case 'add': {
      const validated = validateAddress(action.address)
      if (!validated) return { ok: false, reason: 'invalid-address' }
      next = [...current, validated]
      break
    }
    case 'edit': {
      if (action.index < 0 || action.index >= current.length) return { ok: false, reason: 'not-found' }
      const validated = validateAddress(action.address)
      if (!validated) return { ok: false, reason: 'invalid-address' }
      next = current.map((a, i) => (i === action.index ? validated : a))
      break
    }
    case 'remove': {
      if (action.index < 0 || action.index >= current.length) return { ok: false, reason: 'not-found' }
      next = current.filter((_, i) => i !== action.index)
      break
    }
    case 'setDefault': {
      if (action.index < 0 || action.index >= current.length) return { ok: false, reason: 'not-found' }
      const chosen = current[action.index]
      next = [chosen, ...current.filter((_, i) => i !== action.index)]
      break
    }
  }

  const payload = await getPayload({ config })
  const updated = await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { addresses: next },
    overrideAccess: false,
    user: customer,
  })

  return { ok: true, addresses: updated.addresses ?? [] }
}
