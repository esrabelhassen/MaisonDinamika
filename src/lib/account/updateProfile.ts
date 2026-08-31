'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCustomer } from '@/lib/auth/getCustomer'

export type ProfileInput = { fullName: string; phone: string }

export type UpdateProfileResult = { ok: true } | { ok: false; reason: 'unauthenticated' | 'invalid' }

export async function updateProfile(input: ProfileInput): Promise<UpdateProfileResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, reason: 'unauthenticated' }
  if (!input.fullName?.trim() || !input.phone?.trim()) return { ok: false, reason: 'invalid' }

  const payload = await getPayload({ config })
  await payload.update({
    collection: 'customers',
    id: customer.id, // session only — never client input
    data: { fullName: input.fullName.trim(), phone: input.phone.trim() },
    overrideAccess: false,
    user: customer,
  })

  return { ok: true }
}
