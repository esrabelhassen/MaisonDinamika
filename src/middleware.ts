import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, dirFor, isValidLocale } from '@/lib/i18n'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}`
    return NextResponse.redirect(url)
  }

  // Read the first path segment as a locale candidate so we can stamp x-locale for
  // the root layout — actual 404-on-unknown-locale enforcement happens in
  // src/app/(frontend)/[locale]/layout.tsx (params are validated there).
  const [, maybeLocale] = pathname.split('/')
  const candidate = maybeLocale ?? ''
  const locale = isValidLocale(candidate) ? candidate : defaultLocale

  // Set these on the outgoing REQUEST (not just the response) so the root layout's
  // headers() call — read during Server Component rendering, upstream of the
  // response — can see them.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', locale)
  requestHeaders.set('x-locale-dir', dirFor(locale))
  // Lets a layout (which Next renders before its child page, so it can't just read
  // its own page's route params) reconstruct the ORIGINAL path for a ?redirect=
  // target — e.g. /compte/layout.tsx redirecting an anonymous visitor away from
  // /compte/adresses needs to send them back to that exact sub-page, not just /compte.
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Everything except Payload's own routes, Next internals, and static files.
  matcher: ['/((?!admin|api|_next|favicon.ico|.*\\.[\\w]+$).*)'],
}
