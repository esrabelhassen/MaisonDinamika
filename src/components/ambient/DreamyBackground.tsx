'use client'

// Site-wide ambient backdrop: mounted ONCE in the (frontend) root layout, so it's
// the very first thing in <body> and sits behind every storefront page — including
// behind the 3D hero. The hero's <canvas> is already fully transparent (alpha:true,
// clearColor alpha 0) and its section wrapper sets no background of its own, so a
// `position: fixed` layer at a negative z-index, painted before everything else in
// the root stacking context, shows straight through both of them without touching
// a single line of the hero rig (src/components/hero/*) — this file never imports
// or references it. Because it's `fixed` (viewport-relative, not page-relative) it
// never scrolls away: the same blooms sit behind the hero AND every section below
// it, which is what makes the ground read as one continuous surface with no seam.
//
// Three huge, softly-falling-off radial-gradient blooms (no `filter: blur`, which
// would be far more expensive to composite at this size — the gradient's own
// transparent falloff does the softening for free) drifting on independent, very
// slow (37–58s) CSS keyframe cycles — @keyframes dreamy-drift-{a,b,c} in
// globals.css. Only `transform` and `opacity` are animated (GPU-composited, no
// layout/paint cost per frame). `motion-reduce:animate-none` (Tailwind's built-in
// `prefers-reduced-motion` variant, already used elsewhere in this codebase) drops
// the animation entirely, leaving each bloom resting at its 0%/100% keyframe — a
// still, soft gradient rather than a moving one.
//
// Colors: `surface` (warm ivory/cream) and the new single-purpose `dream-gold`
// token (pale gold/sand) carry the warmth; `glaze-light` appears once, at a much
// lower peak alpha, as the "faint slate-blue whisper" the brief allows — the crisp
// `glaze`/`glaze-deep` accent itself is never used here, so blue stays reserved
// for foreground buttons/links/focus, not the haze. Peak alphas (0.55/0.5/0.18)
// were chosen and contrast-checked so that even directly over the brightest overlap
// of all three blooms, `ink` and `muted` text sitting on the plain `paper` page
// background still clears WCAG AA (~11.7:1 and ~5:1 respectively) — see the PR
// notes for the full sRGB contrast calculation.
export default function DreamyBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* A: ivory/cream — surface #EAE1D2 */}
      <div
        className="absolute -left-[15vmax] -top-[25vmax] h-[85vmax] w-[85vmax] animate-[dreamy-drift-a_46s_ease-in-out_infinite] rounded-full motion-reduce:animate-none"
        style={{
          background: 'radial-gradient(circle, rgba(234,225,210,0.55) 0%, rgba(234,225,210,0) 70%)',
        }}
      />
      {/* B: pale gold/sand — dream-gold #E9D8A8 */}
      <div
        className="absolute -bottom-[20vmax] -right-[10vmax] h-[75vmax] w-[75vmax] animate-[dreamy-drift-b_58s_ease-in-out_infinite] rounded-full motion-reduce:animate-none"
        style={{
          background: 'radial-gradient(circle, rgba(233,216,168,0.5) 0%, rgba(233,216,168,0) 70%)',
        }}
      />
      {/* C: faint slate-blue whisper — glaze-light #C8CCD5, low peak alpha on purpose */}
      <div
        className="absolute -top-[5vmax] -right-[5vmax] h-[60vmax] w-[60vmax] animate-[dreamy-drift-c_37s_ease-in-out_infinite] rounded-full motion-reduce:animate-none"
        style={{
          background: 'radial-gradient(circle, rgba(200,204,213,0.18) 0%, rgba(200,204,213,0) 70%)',
        }}
      />
    </div>
  )
}
