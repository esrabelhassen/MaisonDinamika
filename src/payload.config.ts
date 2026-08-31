import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Sets } from './collections/Sets'
import { Collections } from './collections/Collections'
import { Orders } from './collections/Orders'
import { Homepage } from './globals/Homepage'
import { Apropos } from './globals/Apropos'
import { Contact } from './globals/Contact'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug },
  collections: [Users, Customers, Media, Categories, Products, Sets, Collections, Orders],
  globals: [Homepage, Apropos, Contact, SiteSettings],
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI || '' } }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  // FR primary; AR ships RTL; EN optional. Add translations later without a schema change.
  localization: {
    locales: [
      { label: 'Français', code: 'fr' },
      { label: 'العربية', code: 'ar', rtl: true },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'fr',
    fallback: true,
  },
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
