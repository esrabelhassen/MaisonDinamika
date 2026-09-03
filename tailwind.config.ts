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
        paper: '#F3EDE2', // was #F4F2EC — deeper, warmer ivory so it reads intentional
        surface: '#EAE1D2', // NEW — second warm surface for alternating sections/cards
        line: '#DDD2BE', // NEW — warm hairline/border, replaces cool border-glaze-light on structure
        ink: '#2A2620', // was #20242A — warm espresso, not cool near-black
        muted: '#655B4C', // was #767B82 — warm taupe-grey (AA-checked against paper AND surface)
        glaze: '#5E7386',
        'glaze-deep': '#3B4652',
        'glaze-light': '#C8CCD5',
        'glaze-mid': '#77899E',
        'glaze-dark': '#363F49',
        'rim-brown': '#3E2A20',
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
