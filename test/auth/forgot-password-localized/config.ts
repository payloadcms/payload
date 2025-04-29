import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'

export const collectionSlug = 'users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    user: collectionSlug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  localization: {
    locales: ['en', 'pl'],
    defaultLocale: 'en',
  },
  collections: [
    {
      slug: collectionSlug,
      auth: {
        forgotPassword: {
          // Default options
        },
      },
      fields: [
        {
          name: 'localizedField',
          type: 'text',
          localized: true, // This field is localized and will require locale during validation
          required: true,
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['user'],
          hasMany: true,
          label: 'Role',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          required: true,
          saveToJWT: true,
        },
      ],
    },
  ],
  debug: true,
})
