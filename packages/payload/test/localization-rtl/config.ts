import { devUser } from '../credentials';
import { localization } from './localization';
import { Users } from './collections/users';
import { Posts } from './collections/posts';
import en from '../../src/translations/en.json';
import { ar } from './ar';
import deepMerge from './deepMerge';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';

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
