import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type {
  GenerateDescription,
  GenerateImage,
  GenerateTitle,
  GenerateURL,
} from '@payloadcms/plugin-seo/types'
import type { Field } from 'payload'

import { seoPlugin } from '@payloadcms/plugin-seo'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'

import type { Page } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { PagesWithImportedFields } from './collections/PagesWithImportedFields.js'
import { Users } from './collections/Users.js'
import { SiteSettings } from './globals/SiteSettings.js'
import { seed } from './seed/index.js'
import { pagesSlug, siteSettingsSlug } from './shared.js'

const generateTitle: GenerateTitle<Page> = async ({ doc, req }) => {
  if (doc?.id) {
    const storedPage = await req.payload.findByID({
      id: doc.id,
      collection: pagesSlug,
      disableErrors: true,
      trash: true,
    })

    return `Website.com — ${storedPage?.title || doc.title}`
  }

  return `Website.com — ${doc?.title}`
}

const generateDescription: GenerateDescription<Page> = ({ doc }) => {
  return doc?.excerpt || 'generated description'
}

const generateImage: GenerateImage<Page> = () => {
  return 'generated-image'
}

const generateURL: GenerateURL<Page> = ({ doc, locale }) => {
  return `https://yoursite.com/${locale ? locale + '/' : ''}${doc?.slug || ''}`
}

export default buildConfigWithDefaults({
  suite: 'plugin-seo',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Users, Pages, Media, PagesWithImportedFields],
    globals: [SiteSettings],
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
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'es', 'de'],
    },
    plugins: [
      seoPlugin({
        collections: ['pages'],
        fields: ({ defaultFields }) => {
          const modifiedFields = defaultFields.map((field) => {
            if ('name' in field && field.name === 'title') {
              return {
                ...field,
                admin: {
                  ...field.admin,
                  components: {
                    ...field.admin.components,
                    afterInput: '/components/AfterInput.js#AfterInput',
                    beforeInput: '/components/BeforeInput.js#BeforeInput',
                  },
                },
                required: true,
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
        generateImage,
        generateTitle,
        generateURL,
        globals: [siteSettingsSlug],
        tabbedUI: true,
        uploadsCollection: 'media',
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
      overrideAccess: true,
    })

    await payload.create({
      collection: 'users',
      data: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: 'non-admin@example.com',
        password: 'test',
      },
    })

    await seed(payload)
  },
})
