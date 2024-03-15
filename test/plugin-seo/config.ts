import { seo } from '../../packages/plugin-seo/src/index.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [Users, Pages, Media],
  i18n: {
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
    seo({
      collections: ['users'],
      fields: [],
      tabbedUI: true,
    }),
    seo({
      collections: ['pages', 'posts'],
      fieldOverrides: {
        title: {
          required: true,
        },
      },
      fields: [
        {
          name: 'ogTitle',
          type: 'text',
          label: 'og:title',
        },
      ],
      generateDescription: ({ doc }: any) => doc?.excerpt?.value || 'generated description',
      generateTitle: (data: any) => `Website.com — ${data?.doc?.title?.value}`,
      generateURL: ({ doc, locale }: any) =>
        `https://yoursite.com/${locale ? locale + '/' : ''}${doc?.slug?.value || ''}`,
      globals: ['settings'],
      tabbedUI: true,
      uploadsCollection: 'media',
    }),
  ],
})
