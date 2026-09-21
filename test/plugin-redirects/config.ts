import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  suite: 'plugin-redirects',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Users, Pages],
    i18n: {
      translations: {
        // Test that custom translations can override ONLY specific keys
        // All other keys will use the plugin's defaults
        de: {
          $schema: './translation-schema.json',
          'plugin-redirects': {
            // Full German translations (not included in plugin by default)
            customUrl: 'Benutzerdefinierte URL',
            documentToRedirect: 'Dokument zum Weiterleiten',
            fromUrl: 'Quell-URL',
            internalLink: 'Interner Link',
            redirectType: 'Weiterleitungstyp',
            toUrlType: 'Ziel-URL-Typ',
          },
        },
        en: {
          $schema: './translation-schema.json',
          'plugin-redirects': {
            fromUrl: 'Source URL (Custom)', // Override just this one key
            // All other keys (customUrl, internalLink, etc.) will use plugin defaults
          },
        },
      },
    },
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'es', 'de'],
    },
    plugins: [
      redirectsPlugin({
        collections: ['pages'],
        overrides: {
          fields: ({ defaultFields }) => {
            return [
              ...defaultFields,
              {
                name: 'customField',
                type: 'text',
              },
            ]
          },
        },
        redirectTypeFieldOverride: {
          label: 'Redirect Type (Overridden)',
        },
        redirectTypes: ['301', '302'],
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
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

    await seed(payload)
  },
})
