// Two place settings, sharing a table — two plate-rim circles overlapping, linked
// by a thin traced arc with a small spark at the midpoint (the shared reward).
// Same minimal stroke-line language as the header/footer icons and the collection
// bands' circular badge, on the same soft radial backdrop the hero's own fallback
// visual uses (bg-[radial-gradient(...)]) — no photography needed for this page.
export default function ParrainageIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_38%_35%,#F3EDE2,#C8CCD5_55%,#77899E_100%)]">
      <svg
        aria-hidden
        viewBox="0 0 320 320"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="absolute inset-0 h-full w-full text-glaze-dark"
      >
        {/* Two overlapping plate rims */}
        <circle cx="118" cy="150" r="72" />
        <circle cx="118" cy="150" r="46" strokeWidth={1} opacity={0.6} />
        <circle cx="212" cy="184" r="58" />
        <circle cx="212" cy="184" r="36" strokeWidth={1} opacity={0.6} />

        {/* The traced arc linking the two settings */}
        <path
          d="M170 128c22-10 46-6 60 14"
          strokeLinecap="round"
          strokeDasharray="1 9"
          opacity={0.9}
        />

        {/* A small spark at the midpoint — the shared reward */}
        <g transform="translate(196 118)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 -11v8M0 3v8M-11 0h8M3 0h8M-6.5 -6.5l4 4M2.5 2.5l4 4M-6.5 6.5l4 -4M2.5 -2.5l4 -4" />
        </g>
      </svg>
    </div>
  )
}
