import { getPayload } from 'payload'
import config from '@payload-config'
import type { Locale } from '@/lib/i18n'

// Quiet, minimal — its job is to give the header's Contact link a real #contact
// anchor to land on, and to surface the CMS-owned contact details.
export default async function Footer({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })

  const contact = await payload.findGlobal({
    slug: 'contact',
    locale,
    overrideAccess: false,
  })

  const links = [
    contact.phone ? { href: `tel:${contact.phone}`, label: contact.phone } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: contact.email } : null,
    contact.facebook ? { href: contact.facebook, label: 'Facebook' } : null,
    contact.instagram ? { href: contact.instagram, label: 'Instagram' } : null,
  ].filter((link): link is { href: string; label: string } => link !== null)

  return (
    <footer id="contact" className="border-t border-glaze-light bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg">Maison Dinamika</p>
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
