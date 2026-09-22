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
import { SousCategories } from './collections/SousCategories'
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
  collections: [Users, Customers, Media, Categories, SousCategories, Products, Sets, Collections, Orders],
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
      // `clientUploads: true` (browser uploads straight to Blob storage,
      // bypassing Vercel's 4.5MB serverless function body cap) was tried
      // first, but a live audit of every uploaded photo found ~36% had
      // silently failed — the admin shows the upload as successful and
      // creates the Media doc, but the file itself never actually lands in
      // storage, so it 404s on the live site with no warning anywhere. That
      // failure mode is worse than the size cap it was meant to avoid: every
      // real product photo uploaded so far has been well under 1MB, so
      // routing uploads through the server instead (the default) trades an
      // essentially theoretical size limit for actually-reliable uploads —
      // and if a photo ever does exceed 4.5MB, THAT fails loudly and
      // immediately in the admin instead of silently on the storefront days
      // later. `clientUploads` left unset here (defaults to false/off).
    }),
  ],
})
