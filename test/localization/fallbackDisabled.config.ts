import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const fallbackDisabledPagesSlug = 'fallback-disabled-pages'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: fallbackDisabledPagesSlug,
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'slug',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
  localization: {
    defaultLocale: 'de',
    fallback: false,
    locales: ['de', 'en'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'fallbackDisabled-payload-types.ts'),
  },
})
