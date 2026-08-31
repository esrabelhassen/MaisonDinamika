import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { slugField } from '../fields/slug'

// Drives the "Produits" mega-dropdown. Add a category + assign items → menu rebuilds.
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
    { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true },
    { name: 'sets', type: 'relationship', relationTo: 'sets', hasMany: true },
  ],
}
