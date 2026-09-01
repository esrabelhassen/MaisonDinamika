import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'

// Shared shell for pages that exist as a real route (so nav links never 404) but
// have no content yet — same calm/centered language as the Collection page's
// empty state, just with its own heading and a way back into the shop.
export default function ComingSoon({
  locale,
  title,
  text,
}: {
  locale: Locale
  title: string
  text: string
}) {
  const nav = getNavDict(locale)

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center sm:py-28">
      <p className="text-sm uppercase tracking-[0.28em] text-glaze">{nav.bientotDisponible}</p>
      <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">{title}</h1>
      <div aria-hidden className="mx-auto mt-6 h-px w-16 bg-glaze-light" />
      <p className="mt-8 max-w-[50ch] text-lg leading-relaxed text-muted">{text}</p>
      <Link
        href={paths.home(locale)}
        className="mt-10 inline-block rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep motion-reduce:transition-none"
      >
        {nav.retourAlAccueil}
      </Link>
    </div>
  )
}
