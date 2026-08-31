import type { GlobalConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'

export const Apropos: GlobalConfig = {
  slug: 'apropos',
  label: 'À propos',
  admin: { group: 'Contenu' },
  access: { read: anyone, update: admins },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'body', type: 'richText', localized: true },
    {
      name: 'images',
      type: 'array',
      labels: { singular: 'Image', plural: 'Images' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
  ],
}
