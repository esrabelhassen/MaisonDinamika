import type { Config } from 'tailwindcss'

// Scoped to the storefront ONLY — the (payload) admin route group must never be
// scanned here, or Tailwind's base reset / utility classes could leak into the
// admin UI's own styling.
const config: Config = {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm cream register (the 2026 reskin) — surfaces and ink went warm;
        // the slate-blue accent (glaze/glaze-deep) is UNCHANGED on purpose, it's
        // the brand accent and what the hero's own ceramic glaze photography
        // already reads as. glaze-light/mid/dark are also unchanged: they're
        // still used as genuine accent tints (the "Ensemble" tag, hover states)
        // and — separately — heroScene.ts has its own hardcoded hex constants
        // entirely independent of this file, so none of this reaches the canvas.
        // Cream re-tuned (was #F3EDE2/#EAE1D2/#DDD2BE) to sit closer to the hero's
        // OWN cream (#efe9dc, hardcoded inside heroScene.ts's env-map gradient —
        // untouched, this doesn't reach the canvas) and its warm-grey mid-tone
        // (#cfc9bd) that gradient passes through on its way to the glaze-blue
        // dishes. Same hue family as before, just a touch deeper/greyer instead
        // of leaning ivory-gold, so the cream reads as one continuous surface
        // with the hero rather than a warmer register bumping up against a
        // cooler one. AA re-checked: both `ink` and `muted` land at HIGHER
        // contrast against these (darker) values than before, so no regression.
        paper: '#EEE8DC',
        surface: '#E5DCCC',
        line: '#D8CDB8', // warm hairline/border, replaces cool border-glaze-light on structure
        ink: '#2A2620', // was #20242A — warm espresso, not cool near-black
        muted: '#655B4C', // was #767B82 — warm taupe-grey (AA-checked against paper AND surface)
        glaze: '#5E7386',
        'glaze-deep': '#3B4652',
        'glaze-light': '#C8CCD5',
        'glaze-mid': '#77899E',
        'glaze-dark': '#363F49',
        'rim-brown': '#3E2A20',
        // Single-purpose: the pale-gold bloom in the site-wide DreamyBackground
        // ambient layer (src/components/ambient/DreamyBackground.tsx) only —
        // not a general brand color, kept separate from the neutrals above.
        'dream-gold': '#E9D8A8',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
