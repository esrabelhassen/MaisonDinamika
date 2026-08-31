import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Customer } from '@/payload-types'

/**
 * Server-side session read for the storefront. Resolves the incoming request's auth
 * cookie via Payload's Local API — never throws, returns null on any problem (no
 * session, expired token, or a session that belongs to a different auth collection).
 *
 * Note: admin (`users`) and storefront (`customers`) sessions share the same cookie
 * name (Payload's `cookiePrefix` is a single global config value, not per-collection)
 * — logging into one overwrites the other's cookie. The `collection` check below is
 * what keeps that from becoming a role-confusion bug: an admin's token is never
 * treated as a valid customer session here, and vice versa.
 */
export async function getCustomer(): Promise<Customer | null> {
  try {
    const payload = await getPayload({ config })
    const headerList = await getHeaders()
    const { user } = await payload.auth({ headers: headerList })
    if (!user || user.collection !== 'customers') return null
    return user as Customer
  } catch {
    return null
  }
}
