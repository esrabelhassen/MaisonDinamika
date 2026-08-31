import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { slugField } from '../fields/slug'

// Individual items — sold separately, own price.
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Boutique',
    defaultColumns: ['name', 'priceTND', 'stock', 'isNew', 'status'],
  },
  access: {
    // Public sees only published; admins see drafts too.
    read: ({ req: { user } }) =>
      user?.collection === 'users' ? true : { status: { equals: 'published' } },
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    { name: 'description', type: 'richText', localized: true },
    {
      name: 'priceTND',
      label: 'Prix (TND)',
      type: 'number',
      required: true,
      min: 0,
      admin: { step: 0.001, description: 'En dinars, ex. 28.500' },
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    { name: 'stock', type: 'number', required: true, defaultValue: 0, min: 0 },
    {
      name: 'isNew',
      label: 'Nouveauté',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Publié', value: 'published' },
      ],
    },
  ],
}
