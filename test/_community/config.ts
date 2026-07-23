import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const usersSlug = 'users'

export const UsersCollection: CollectionConfig = {
  slug: usersSlug,
  admin: {
    useAsTitle: 'displayName',
  },
  auth: {
    useSessions: true,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      defaultValue: '[placeholder]',
      localized: true,
      required: true,
    },
  ],
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: usersSlug,
  },
  collections: [UsersCollection],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: usersSlug,
      data: {
        displayName: 'Test User',
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
