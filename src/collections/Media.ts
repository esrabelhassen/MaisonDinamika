import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'

// Every image on the site lives here → "all images editable" comes for free.
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Contenu' },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 768 },
      { name: 'hero', width: 1920 },
    ],
  },
  fields: [{ name: 'alt', type: 'text', localized: true }],
}
