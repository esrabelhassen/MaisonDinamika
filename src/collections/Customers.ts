import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { adminsOrSelf } from '../access/adminsOrSelf'
import { governorates } from '../lib/governorates'

// Storefront accounts. Public signup; each customer only sees themselves.
export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: true,
  admin: { useAsTitle: 'email', group: 'Boutique' },
  access: { create: anyone, read: adminsOrSelf, update: adminsOrSelf, delete: admins },
  fields: [
    { name: 'fullName', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    {
      name: 'addresses',
      type: 'array',
      labels: { singular: 'Adresse', plural: 'Adresses' },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'line1', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'governorate', type: 'select', options: governorates, required: true },
        { name: 'phone', type: 'text' },
      ],
    },
  ],
}
