import en from '../../packages/payload/src/translations/en.json'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { ar } from './ar'
import { Posts } from './collections/posts'
import { Users } from './collections/users'
import deepMerge from './deepMerge'
import { localization } from './localization'

export default buildConfigWithDefaults({
  collections: [Users, Posts],
  i18n: {
    fallbackLng: 'en', // default
    debug: false, // default
    resources: {
      ar: deepMerge(en, ar),
    },
  },
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Arabic',
        code: 'ar',
        rtl: true,
      },
    ],
    defaultLocale: 'en',
    fallback: true,
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
})
