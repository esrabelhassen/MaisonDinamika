// Dinar tunisien has 3 decimal places (millimes) — but a whole-number price like
// "28" shouldn't render as "28.000 DT", so we only show fraction digits when the
// value actually has them.
export function formatPriceTND(value: number): string {
  const hasFraction = value % 1 !== 0
  const formatted = new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: 3,
  }).format(value)
  return `${formatted} DT`
}
