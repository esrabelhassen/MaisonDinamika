import type { Config } from 'tailwindcss'

// Scoped to the storefront ONLY — the (payload) admin route group must never be
// scanned here, or Tailwind's base reset / utility classes could leak into the
// admin UI's own styling.
const config: Config = {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F2EC',
        ink: '#20242A',
        muted: '#767B82',
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
