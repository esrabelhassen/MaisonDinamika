import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'
import { getNavDict, paths } from '@/lib/i18n'
import { resolveLogo } from '@/lib/media'
import Logo from '@/components/Logo'

type ContactLinkType = 'phone' | 'email' | 'facebook' | 'instagram'
type ContactLink = { type: ContactLinkType; href: string; label: string }

type PromoType = 'parrainage' | 'espace-pro' | 'fidelite'
type PromoCard = { type: PromoType; href: string; title: string; text: string; cta: string }

// The footer's job: give the header's Contact link a real #contact anchor, surface
// the CMS-owned contact details, and point to the three promo destinations
// (Parrainage / Espace PRO / Fidélité) from anywhere on the site.
export default async function Footer({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })
  const nav = getNavDict(locale)

  const [contact, settings] = await Promise.all([
    payload.findGlobal({ slug: 'contact', locale, overrideAccess: false }),
    payload.findGlobal({ slug: 'site-settings', locale, overrideAccess: false }),
  ])

  const brandName = settings.brandName || 'Maison Dinamika'
  const logo = resolveLogo(settings.logo, brandName)

  const contactLinks: ContactLink[] = [
    contact.phone ? { type: 'phone', href: `tel:${contact.phone}`, label: contact.phone } : null,
    contact.email ? { type: 'email', href: `mailto:${contact.email}`, label: contact.email } : null,
    contact.facebook ? { type: 'facebook', href: contact.facebook, label: 'Facebook' } : null,
    contact.instagram ? { type: 'instagram', href: contact.instagram, label: 'Instagram' } : null,
  ].filter((link): link is ContactLink => link !== null)

  const promoCards: PromoCard[] = [
    {
      type: 'parrainage',
      href: paths.parrainage(locale),
      title: nav.parrainageTitre,
      text: nav.parrainageAccroche,
      cta: nav.parrainageCta,
    },
    {
      type: 'espace-pro',
      href: paths.espacePro(locale),
      title: nav.espaceProTitre,
      text: nav.espaceProAccroche,
      cta: nav.espaceProCta,
    },
    {
      type: 'fidelite',
      href: paths.fidelite(locale),
      title: nav.fideliteTitre,
      text: nav.fideliteAccroche,
      cta: nav.fideliteCta,
    },
  ]

  const year = new Date().getFullYear()

  return (
    <footer id="contact" className="border-t border-glaze-light bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 border-b border-paper/10 pb-14 sm:grid-cols-3 sm:gap-8">
          {promoCards.map((card) => (
            <div key={card.type}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-glaze-light/30 text-glaze-light">
                <PromoIcon type={card.type} />
              </div>
              <h3 className="mt-5 font-display text-xl text-paper">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-glaze-light">{card.text}</p>
              <Link
                href={card.href}
                className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-sm text-paper underline-offset-4 transition-colors hover:text-glaze-light hover:underline motion-reduce:transition-none"
              >
                {card.cta}
                <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-10 pt-14 sm:flex-row sm:items-center sm:justify-between">
          <Logo
            locale={locale}
            logo={logo}
            brandName={brandName}
            // The footer has no fixed-height bar to overflow (unlike the header),
            // so it just gets a generous, fully-contained size: 64px mobile, 96px
            // from `lg` up.
            heightClassName="h-16 lg:h-24"
            textClassName="text-lg"
            linkClassName="text-paper"
            // The footer background is dark (bg-ink); an uploaded mark is very
            // likely a dark/monochrome logotype (matching the header's ink-coloured
            // treatment), so it gets a small light backing chip here instead of a
            // colour-guessing CSS filter — legible regardless of the logo's actual
            // colours, and harmless for a light or multi-colour mark too.
            imageClassName="rounded-lg bg-paper/95 p-2"
          />
          {contactLinks.length > 0 && (
            <ul className="flex flex-wrap items-center gap-3">
              {contactLinks.map((link) => {
                // Facebook/Instagram leave the site; phone/email hand off to the
                // device's own dialer/mail app, so only the two web links get
                // target=_blank (opening a tel:/mailto: link in a new tab would
                // just leave a blank tab behind).
                const external = link.type === 'facebook' || link.type === 'instagram'
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      aria-label={link.label}
                      title={link.label}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-glaze-light/40 text-glaze-light transition-colors hover:border-paper hover:text-paper motion-reduce:transition-none"
                    >
                      <ContactIcon type={link.type} />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-10 border-t border-paper/10 pt-6 text-xs text-glaze-light/70">
          © {year} {brandName}. {nav.droitsReserves}
        </div>
      </div>
    </footer>
  )
}

// Minimal stroke icons matching the header's CartIcon language (24x24 viewBox,
// currentColor stroke, 1.5 weight) — decorative only (aria-hidden), the link
// itself carries the real accessible name via aria-label.
function ContactIcon({ type }: { type: ContactLinkType }) {
  switch (type) {
    case 'phone':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l1.9-1.9c.3-.3.7-.4 1.1-.3 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.3c0 .6-.4 1-1 1C9.7 20.5 3.5 14.3 3.5 6.8c0-.6.4-1 1-1H7.8c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1.1L6.6 10.8Z"
          />
        </svg>
      )
    case 'email':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
        </svg>
      )
    case 'facebook':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.4 20.2v-6.1h2.1l.3-2.5h-2.4V9.9c0-.7.2-1.2 1.2-1.2h1.3V6.4c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.9H8.7v2.5h2.1v6.2Z"
          />
        </svg>
      )
    case 'instagram':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}

function PromoIcon({ type }: { type: PromoType }) {
  switch (type) {
    case 'parrainage':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <rect x="3.5" y="9.5" width="17" height="10.5" rx="1.5" />
          <path strokeLinecap="round" d="M3.5 13.5h17" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9.5v10.5M12 9.5C10.5 6 7 6 7 8.2 7 9.7 9 9.5 12 9.5Zm0 0C13.5 6 17 6 17 8.2c0 1.5-2 1.3-5 1.3Z"
          />
        </svg>
      )
    case 'espace-pro':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v1.5" />
          <path strokeLinecap="round" d="M3.5 12.5h17" />
        </svg>
      )
    case 'fidelite':
      return (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19.5s-7.5-4.4-7.5-9.7C4.5 6.9 6.5 5 9 5c1.4 0 2.6.7 3 1.9C12.4 5.7 13.6 5 15 5c2.5 0 4.5 1.9 4.5 4.8 0 5.3-7.5 9.7-7.5 9.7Z"
          />
        </svg>
      )
  }
}
