import { devUser } from '../credentials.js';
import { Users } from './collections/users.js';
import { Posts } from './collections/posts.js';
import en from '../../src/translations/en.json';
import { ar } from './ar.js' assert { type: "json" };
import deepMerge from './deepMerge.js';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js';

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
    });
  },
});
