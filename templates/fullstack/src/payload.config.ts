import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

import { Categories } from './collections/Categories/index.js'
import { Media } from './collections/Media/index.js'
import { Posts } from './collections/Posts/index.js'
import { Users } from './collections/Users/index.js'
import { Menu } from './globals/Menu/index.js'
import { adminOnly, authenticated } from './access/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: { baseDir: dirname },
    user: Users.slug,
  },
  collections: [Users, Posts, Media, Categories],
  db: mongooseAdapter({ url: process.env.DATABASE_URL ?? '' }),
  editor: lexicalEditor(),
  globals: [{ ...Menu, access: { read: authenticated, update: adminOnly } }],
  secret: process.env.PAYLOAD_SECRET ?? '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
