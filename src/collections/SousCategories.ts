import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { slugField } from '../fields/slug'

// One level under Categories: this is what actually holds products/sets and
// what the "Produits" mega-dropdown links to. Category itself is now just a
// grouping label in the menu (not clickable, has no page of its own) — see
// Categories.ts's `sousCategories` join field for the reverse lookup admins
// see when opening a category.
export const SousCategories: CollectionConfig = {
  slug: 'sous-categories',
  labels: { singular: 'Sous-catégorie', plural: 'Sous-catégories' },
  admin: { useAsTitle: 'name', group: 'Boutique', defaultColumns: ['name', 'category', 'order'] },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar', description: 'Catégorie parente (affichée dans le menu Produits)' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Ordre dans le menu Produits' },
    },
    { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true },
    { name: 'sets', type: 'relationship', relationTo: 'sets', hasMany: true },
  ],
}
