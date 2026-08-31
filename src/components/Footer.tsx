import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'
import { resolveLogo } from '@/lib/media'
import Logo from '@/components/Logo'

// Quiet, minimal — its job is to give the header's Contact link a real #contact
// anchor to land on, and to surface the CMS-owned contact details.
export default async function Footer({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })

  const [contact, settings] = await Promise.all([
    payload.findGlobal({ slug: 'contact', locale, overrideAccess: false }),
    payload.findGlobal({ slug: 'site-settings', locale, overrideAccess: false }),
  ])

  const brandName = settings.brandName || 'Maison Dinamika'
  const logo = resolveLogo(settings.logo, brandName)

  const links = [
    contact.phone ? { href: `tel:${contact.phone}`, label: contact.phone } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: contact.email } : null,
    contact.facebook ? { href: contact.facebook, label: 'Facebook' } : null,
    contact.instagram ? { href: contact.instagram, label: 'Instagram' } : null,
  ].filter((link): link is { href: string; label: string } => link !== null)

  return (
    <footer id="contact" className="border-t border-glaze-light bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <Logo
          locale={locale}
          logo={logo}
          brandName={brandName}
          heightClassName="h-9"
          textClassName="text-lg"
          linkClassName="text-paper"
          // The footer background is dark (bg-ink); an uploaded mark is very
          // likely a dark/monochrome logotype (matching the header's ink-coloured
          // treatment), so it gets a small light backing chip here instead of a
          // colour-guessing CSS filter — legible regardless of the logo's actual
          // colours, and harmless for a light or multi-colour mark too. (Padding
          // eats into the h-9 box, so the visible mark lands close to the old
          // text wordmark's size.)
          imageClassName="rounded bg-paper/95 p-1.5"
        />
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-glaze-light">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="rounded-sm hover:text-paper">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  )
}
