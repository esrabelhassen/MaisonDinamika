// Static, hand-picked copy — same call as Hero's own hardcoded eyebrow/headline
// (see the comment in [locale]/page.tsx): homepage social proof, not something
// that needs a CMS field to exist. Cards use a translucent `bg-paper/80` +
// `backdrop-blur-sm` (rather than a flat opaque surface) on purpose, so the
// site-wide DreamyBackground ambient blooms stay faintly visible through them
// here at the foot of the page, right before the footer.
type Review = {
  name: string
  city: string
  quote: string
}

const REVIEWS: Review[] = [
  {
    name: 'Amira Ben Salah',
    city: 'Tunis',
    quote:
      'Les assiettes sont encore plus belles en vrai qu’en photo. La glaçure bleu-gris habille toute ma table — mes invités n’arrêtent pas d’en parler.',
  },
  {
    name: 'Youssef Trabelsi',
    city: 'Sousse',
    quote:
      'Commande reçue en trois jours, emballage soigné, pas une seule pièce abîmée. On sent que chaque assiette a été choisie avec attention.',
  },
  {
    name: 'Salma Gharbi',
    city: 'Sfax',
    quote:
      'J’ai composé mon service pièce par pièce et le rendu est exactement celui que je voulais : sobre, chaleureux, élégant. Un vrai coup de cœur.',
  },
]

export default function Testimonials() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <div className="text-sm uppercase tracking-[0.28em] text-glaze">Avis clients</div>
        <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
          Ils ont composé leur table avec nous
        </h2>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">
        {REVIEWS.map((review) => (
          <figure
            key={review.name}
            className="flex flex-col rounded-2xl border border-line bg-paper/80 p-8 shadow-sm backdrop-blur-sm"
          >
            <Stars />
            <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-ink">
              “{review.quote}”
            </blockquote>
            <figcaption className="mt-6 border-t border-line pt-5">
              <div className="font-display text-lg text-ink">{review.name}</div>
              <div className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted">{review.city}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Stars() {
  return (
    <div className="flex gap-1 text-glaze" role="img" aria-label="5 étoiles sur 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} aria-hidden viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 1.5l2.59 5.24 5.79.84-4.19 4.08.99 5.77L10 14.77l-5.18 2.66.99-5.77L1.62 7.58l5.79-.84L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}
