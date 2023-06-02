import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import { localization } from './localization';
import { Users } from './collections/users';
import { Posts } from './collections/posts';
import en from '../../src/translations/en.json';
import { ar } from './ar';
import deepMerge from './deepMerge';

export default buildConfig({
  collections: [Users, Posts],
  i18n: {
    fallbackLng: 'en', // default
    debug: false, // default
    resources: {
      ar: deepMerge(en, ar),
    },
  },
  localization,
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
