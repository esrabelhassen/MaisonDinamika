'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCustomer } from '@/lib/auth/getCustomer'

export type ChangePasswordInput = { currentPassword: string; newPassword: string }

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'wrong-password' | 'weak-password' }

const MIN_PASSWORD_LENGTH = 8

/**
 * Requires the CURRENT password even though the session alone would technically let
 * us update it — verified by attempting a real login with (session email, submitted
 * current password) via the Local API. This never touches the browser's cookie (Local
 * API login doesn't set response cookies), so it's a pure verification step; the
 * existing session is untouched either way.
 *
 * Verified empirically that Payload's session tracking (the customer's `sessions`
 * array, keyed by the JWT's `sid`) is untouched by a password update — the current
 * session/cookie stays valid, so no re-login/cookie-reissue is needed afterward.
 */
export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, reason: 'unauthenticated' }

  if (!input.newPassword || input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: 'weak-password' }
  }

  const payload = await getPayload({ config })

  try {
    await payload.login({
      collection: 'customers',
      data: { email: customer.email, password: input.currentPassword },
    })
  } catch {
    return { ok: false, reason: 'wrong-password' }
  }

  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { password: input.newPassword },
    overrideAccess: false,
    user: customer,
  })

  return { ok: true }
}
