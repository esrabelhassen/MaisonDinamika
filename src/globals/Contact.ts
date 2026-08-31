import type { GlobalConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'

// Feeds the Contact nav-scroll target AND the footer.
export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Contact',
  admin: { group: 'Contenu' },
  access: { read: anyone, update: admins },
  fields: [
    { name: 'facebook', type: 'text' },
    { name: 'instagram', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
  ],
}
