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
      en: {
        $schema: './translation-schema.json',
        'plugin-redirects': {
          fromUrl: 'Source URL (Custom)', // Override just this one key
          // All other keys (customUrl, internalLink, etc.) will use plugin defaults
        },
      },
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
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
  plugins: [
    redirectsPlugin({
      collections: ['pages'],
      overrides: {
        fields: ({ defaultFields }) => {
          return [
            ...defaultFields,
            {
              type: 'text',
              name: 'customField',
            },
          ]
        },
      },
      redirectTypes: ['301', '302'],
      redirectTypeFieldOverride: {
        label: 'Redirect Type (Overridden)',
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
