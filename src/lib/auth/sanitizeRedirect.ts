/**
 * Only same-origin relative paths are safe post-login redirect targets. Rejects
 * protocol-relative ("//evil.com"), absolute ("https://evil.com"), and anything not
 * starting with "/" — otherwise a crafted ?redirect= is an open redirect.
 */
export function sanitizeRedirect(target: string | string[] | null | undefined, fallback: string): string {
  const value = Array.isArray(target) ? target[0] : target
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//')) return fallback
  if (value.includes('://')) return fallback
  return value
}
