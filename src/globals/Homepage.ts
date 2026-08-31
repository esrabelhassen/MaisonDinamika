import type { GlobalConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'

// Accueil content: hero copy (feeds the 3D hero text) + Nouveauté section config.
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Accueil',
  admin: { group: 'Contenu' },
  access: { read: anyone, update: admins },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text', localized: true },
        { name: 'headline', type: 'text', localized: true },
        { name: 'sub', type: 'textarea', localized: true },
        { name: 'ctaLabel', type: 'text', localized: true },
        { name: 'ctaLink', type: 'text' },
      ],
    },
    {
      name: 'nouveaute',
      label: 'Nouveauté',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        {
          name: 'mode',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Automatique (articles marqués Nouveauté)', value: 'auto' },
            { label: 'Sélection manuelle', value: 'manual' },
          ],
        },
        {
          name: 'products',
          type: 'relationship',
          relationTo: ['products', 'sets'],
          hasMany: true,
          admin: { condition: (_, sibling) => sibling?.mode === 'manual' },
        },
        { name: 'limit', type: 'number', defaultValue: 8 },
      ],
    },
  ],
}
