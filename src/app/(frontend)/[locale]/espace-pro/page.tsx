import { notFound } from 'next/navigation'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import ComingSoon from '@/components/ComingSoon'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const nav = getNavDict(locale)
  return { title: `${nav.espaceProTitre} — Maison Dinamika` }
}

export default async function EspaceProPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const nav = getNavDict(locale)

  return <ComingSoon locale={locale} title={nav.espaceProTitre} text={nav.bientotDisponibleTexte} />
}
