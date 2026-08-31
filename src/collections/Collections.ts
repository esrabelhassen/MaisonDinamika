import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { slugField } from '../fields/slug'

// Showcase collections (NOT product categories): the auto-scrolling image band
// with a styled title overlay. Fully admin-configurable.
export const Collections: CollectionConfig = {
  slug: 'collections',
  labels: { singular: 'Collection', plural: 'Collections' },
  admin: { useAsTitle: 'title', group: 'Contenu', defaultColumns: ['title', 'slug', 'order'] },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Titre affiché en surimpression sur les images' },
    },
    slugField('title'),
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'overlayStyle',
      type: 'select',
      defaultValue: 'light',
      admin: { position: 'sidebar', description: 'Couleur du texte en surimpression' },
      options: [
        { label: 'Clair', value: 'light' },
        { label: 'Sombre', value: 'dark' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
  ],
}
