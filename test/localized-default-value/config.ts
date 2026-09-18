import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import {
  collectionSlug,
  defaultLocale,
  groupNestedDefaultValue,
  nestedLocalizedGroupDefaultValue,
  spanishLocale,
  staticDefaultValue,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: collectionSlug,
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true,
      },
      fields: [
        {
          name: 'title',
          localized: true,
          type: 'text',
        },
        {
          name: 'myField',
          defaultValue: staticDefaultValue,
          localized: true,
          type: 'text',
        },
        {
          name: 'localeAwareField',
          defaultValue: ({ locale }) => `default-${locale}`,
          localized: true,
          type: 'text',
        },
        {
          name: 'myGroup',
          fields: [
            {
              name: 'nestedField',
              defaultValue: groupNestedDefaultValue,
              type: 'text',
            },
          ],
          localized: true,
          type: 'group',
        },
        {
          name: 'myNonLocalizedGroup',
          fields: [
            {
              name: 'nestedLocalizedField',
              defaultValue: nestedLocalizedGroupDefaultValue,
              localized: true,
              type: 'text',
            },
          ],
          type: 'group',
        },
      ],
      versions: false,
    },
  ],
  localization: {
    defaultLocale,
    fallback: false,
    locales: [defaultLocale, spanishLocale],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
