import seoPlugin from '../../packages/plugin-seo/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { seed } from './seed'

export default buildConfigWithDefaults({
  collections: [Users, Pages, Media],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  i18n: {
    translations: {
      es: {
        'plugin-seo': {
          autoGenerate: 'Auto-génerar',
        },
      },
    },
  },
  plugins: [
    seoPlugin({
      collections: ['users'],
      fields: [],
      tabbedUI: true,
    }),
    seoPlugin({
      collections: ['pages', 'posts'],
      globals: ['settings'],
      tabbedUI: true,
      uploadsCollection: 'media',
      fields: [
        {
          name: 'ogTitle',
          type: 'text',
          label: 'og:title',
        },
      ],
      fieldOverrides: {
        title: {
          required: true,
        },
      },
      generateTitle: (data: any) => `Website.com — ${data?.doc?.title?.value}`,
      generateDescription: ({ doc }: any) => doc?.excerpt?.value || 'generated description',
      generateURL: ({ doc, locale }: any) =>
        `https://yoursite.com/${locale ? locale + '/' : ''}${doc?.slug?.value || ''}`,
    }),
  ],
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
})
