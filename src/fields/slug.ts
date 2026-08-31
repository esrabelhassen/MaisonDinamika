import type { Field } from 'payload'
import { formatSlug } from '../lib/formatSlug'

// Reusable slug field: auto-derives from `from` when left blank, always normalised.
export const slugField = (from = 'name'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: { position: 'sidebar' },
  hooks: {
    beforeValidate: [
      ({ value, data, originalDoc }) => {
        if (typeof value === 'string' && value.length) return formatSlug(value)
        const fallback = (data?.[from] ?? originalDoc?.[from]) as unknown
        if (typeof fallback === 'string') return formatSlug(fallback)
        return value
      },
    ],
  },
})
