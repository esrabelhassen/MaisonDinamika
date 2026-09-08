import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { slugField } from '../fields/slug'

// Showcase collections: the pop-forward "peek" cards on the /collection page.
// Each one belongs to a sous-catégorie — that's BOTH what clicking the card
// links to (its product listing) AND, via the sous-catégorie's own parent,
// which category section on /collection the card is grouped under. This is
// deliberately the ONLY place a collection is categorized — no separate
// `category` field here, so a collection can never be filed under a category
// its own link target doesn't actually belong to.
export const Collections: CollectionConfig = {
  slug: 'collections',
  labels: { singular: 'Collection', plural: 'Collections' },
  admin: { useAsTitle: 'title', group: 'Contenu', defaultColumns: ['title', 'sousCategorie', 'order'] },
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
    {
      name: 'sousCategorie',
      type: 'relationship',
      relationTo: 'sous-categories',
      required: true,
      admin: {
        position: 'sidebar',
        description:
          'Détermine à la fois la section (catégorie) où cette collection apparaît sur /collection, et la page produits vers laquelle elle mène au clic.',
      },
    },
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
