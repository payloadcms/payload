import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const noFallbackPagesSlug = 'no-fallback-pages'
export const noFallbackDefaultLocale = 'de'
export const noFallbackOtherLocale = 'en'

export default buildConfigWithDefaults({
  suite: 'localization-no-fallback',
  config: {
    collections: [
      {
        slug: 'users',
        auth: true,
        fields: [],
      },
      {
        slug: noFallbackPagesSlug,
        access: {
          read: () => true,
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            localized: true,
          },
        ],
      },
    ],
    localization: {
      defaultLocale: noFallbackDefaultLocale,
      fallback: false,
      locales: [noFallbackDefaultLocale, noFallbackOtherLocale],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'noFallback-payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
