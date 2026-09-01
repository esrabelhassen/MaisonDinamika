import { notFound } from 'next/navigation'
import { isValidLocale, getNavDict } from '@/lib/i18n'
import ParrainageIllustration from '@/components/parrainage/ParrainageIllustration'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const nav = getNavDict(locale)
  return { title: `${nav.parrainageTitre} — Maison Dinamika` }
}

const SHARE_SUBJECT = 'Découvrez Maison Dinamika'
const SHARE_BODY =
  'Bonjour,\n\nJe voulais te faire découvrir Maison Dinamika, une enseigne tunisienne d’art de la table que j’aime beaucoup.\n\nÀ bientôt !'

export default async function ParrainagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const nav = getNavDict(locale)
  const shareHref = `mailto:?subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(SHARE_BODY)}`

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-glaze">{nav.parrainageTitre}</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Partagez l’art de la table, profitez-en ensemble !
          </h1>

          <div className="mt-8 flex flex-col gap-5 text-lg leading-relaxed text-muted">
            <p>
              Vous aimez Maison Dinamika&nbsp;? Faites découvrir notre univers à vos amis, votre famille ou vos
              proches.
            </p>
            <p>
              Pour chaque première commande validée grâce à votre parrainage,{' '}
              <em className="italic text-glaze-deep">votre filleul bénéficie de 5% de réduction</em> et
              vous recevez également{' '}
              <em className="italic text-glaze-deep">
                5% du montant de sa commande en avantage fidélité
              </em>
              .
            </p>
            <p>
              Une belle façon de partager vos coups de cœur et de profiter ensemble de l’univers Maison Dinamika.
            </p>
          </div>

          <a
            href={shareHref}
            className="mt-10 inline-block rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-glaze-deep motion-reduce:transition-none"
          >
            {nav.parrainageCta}
          </a>
        </div>

        <ParrainageIllustration />
      </div>
    </div>
  )
}
