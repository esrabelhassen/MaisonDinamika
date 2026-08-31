import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { slugField } from '../fields/slug'

// A set = its own price + a list of component items (contents). Own stock (see note in SETUP).
export const Sets: CollectionConfig = {
  slug: 'sets',
  labels: { singular: 'Ensemble', plural: 'Ensembles' },
  admin: {
    useAsTitle: 'name',
    group: 'Boutique',
    defaultColumns: ['name', 'priceTND', 'stock', 'isNew', 'status'],
  },
  access: {
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
      label: 'Prix de l’ensemble (TND)',
      type: 'number',
      required: true,
      min: 0,
      admin: { step: 0.001, description: 'Prix propre à l’ensemble, indépendant de la somme des pièces' },
    },
    {
      name: 'components',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Composant', plural: 'Composants' },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'qty', type: 'number', required: true, defaultValue: 1, min: 1 },
      ],
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    { name: 'stock', type: 'number', required: true, defaultValue: 0, min: 0 },
    { name: 'isNew', label: 'Nouveauté', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
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
