import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { slugField } from '../fields/slug'

// Drives the "Produits" mega-dropdown, one level up: a Category is just a
// grouping label there (not clickable, no page of its own) — its actual
// sous-catégories (each holding its own products/sets and its own page) are
// managed from the Sous-catégories collection, not here. The `sousCategories`
// field below is a read-only reverse lookup (a `join`, not a real relationship
// stored on this doc) so opening a category in the admin still shows you
// which sous-catégories belong to it.
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name', group: 'Boutique', defaultColumns: ['name', 'slug', 'order'] },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Ordre dans le menu Produits' },
    },
    {
      name: 'sousCategories',
      type: 'join',
      collection: 'sous-categories',
      on: 'category',
      admin: {
        description: 'Sous-catégories de cette catégorie (ajoutées/gérées depuis Sous-catégories).',
      },
    },
  ],
}
