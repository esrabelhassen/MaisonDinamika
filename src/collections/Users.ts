import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'

// Dashboard staff. Separate from storefront Customers.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email', group: 'Système' },
  access: { read: admins, create: admins, update: admins, delete: admins },
  fields: [{ name: 'name', type: 'text' }],
}
