import type { Config } from 'tailwindcss'

// Scoped to the storefront ONLY — the (payload) admin route group must never be
// scanned here, or Tailwind's base reset / utility classes could leak into the
// admin UI's own styling.
const config: Config = {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm cream register (the 2026 reskin) — surfaces and ink went warm.
        paper: '#EEE8DC',
        surface: '#E5DCCC',
        line: '#D8CDB8', // warm hairline/border, replaces cool border-glaze-light on structure
        ink: '#2A2620', // was #20242A — warm espresso, not cool near-black
        muted: '#655B4C', // was #767B82 — warm taupe-grey (AA-checked against paper AND surface)
        // Site-wide accent, re-tuned from slate-blue to a warm gold/champagne
        // (was #5E7386/#3B4652/#C8CCD5/#77899E/#363F49). The `glaze*` NAMES are
        // kept as-is rather than renamed to `gold*` — this token drives border/
        // bg/text/ring/outline classes across ~30 storefront files (buttons,
        // links, focus rings, the "Ensemble" badge…), and Tailwind has no
        // "rename a color, keep every usage" move short of touching every one
        // of those files by hand for zero behavioural gain. Only the swatch
        // changes here; every consumer picks it up automatically. AA-checked
        // as TEXT against both `paper` and `surface` (the shade used for
        // borders/buttons/links/focus, since that's the one also used as small
        // text in a few spots): `glaze` clears ~5.5:1 / ~4.9:1 respectively.
        // heroScene.ts's own ceramic-glaze hex constants are separate and
        // untouched — the ambient DreamyBackground.tsx blue whisper and
        // ParrainageIllustration.tsx's gradient were updated alongside this to
        // match (see those files), since neither is inside the hero rig.
        glaze: '#725822',
        'glaze-deep': '#4A3A16',
        'glaze-light': '#EDE0B8',
        'glaze-mid': '#A8874A',
        'glaze-dark': '#3D3012',
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
