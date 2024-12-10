import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { GenerateDescription, GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import type { Field } from 'payload'
import type { Page } from 'plugin-seo/payload-types.js'

import { seoPlugin } from '@payloadcms/plugin-seo'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { PagesWithImportedFields } from './collections/PagesWithImportedFields.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

const generateTitle: GenerateTitle<Page> = ({ doc }) => {
  return `Website.com — ${doc?.title}`
}

const generateDescription: GenerateDescription<Page> = ({ doc }) => {
  return doc?.excerpt || 'generated description'
}

const generateURL: GenerateURL<Page> = ({ doc, locale }) => {
  return `https://yoursite.com/${locale ? locale + '/' : ''}${doc?.slug || ''}`
}

export default buildConfigWithDefaults({
  collections: [Users, Pages, Media, PagesWithImportedFields],
  i18n: {
    supportedLanguages: {
      en,
      es,
    },
    translations: {
      es: {
        'plugin-seo': {
          autoGenerate: 'Auto-génerar',
        },
      },
    },
  },
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
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
    seoPlugin({
      collections: ['pages'],
      fields: ({ defaultFields }) => {
        const modifiedFields = defaultFields.map((field) => {
          if ('name' in field && field.name === 'title') {
            return {
              ...field,
              required: true,
              admin: {
                ...field.admin,
                components: {
                  ...field.admin.components,
                  afterInput: '/components/AfterInput.js#AfterInput',
                  beforeInput: '/components/BeforeInput.js#BeforeInput',
                },
              },
            } as Field
          }
          return field
        })

        return [
          ...modifiedFields,
          {
            name: 'ogTitle',
            type: 'text',
            label: 'og:title',
          },
        ]
      },
      generateDescription,
      generateTitle,
      generateURL,
      tabbedUI: true,
      uploadsCollection: 'media',
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
