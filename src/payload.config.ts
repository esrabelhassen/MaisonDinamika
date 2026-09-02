import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
  // Vercel's servers have no writable/persistent local disk — uploads (the Media
  // collection) default to writing files to disk, which fails there. This routes
  // uploads to Vercel Blob storage instead, everywhere (local dev included), so
  // behaviour is consistent — it only actually works once BLOB_READ_WRITE_TOKEN
  // is set (see the Vercel Storage tab → Blob store, which auto-injects this on
  // the deployed app; copy the same value into local .env for local uploads).
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Vercel's serverless functions cap request bodies at 4.5MB — routing the
      // upload itself through the function (the default) means anything bigger
      // than that fails with "Your request was too large to submit
      // successfully." This uploads straight from the browser to Vercel Blob
      // instead, bypassing that function-body limit entirely.
      clientUploads: true,
    }),
  ],
})
