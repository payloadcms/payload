import { devUser } from '../credentials';
import { localization } from './localization';
import { Users } from './collections/users';
import { Posts } from './collections/posts';
import { Roles } from './collections/roles';
import { Orders } from './collections/orders';
import en from '../../src/translations/en.json';
import { ar } from './ar';
import deepMerge from './deepMerge';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { Categories } from './collections/categories';
import { Customers } from './collections/customers';

export default buildConfigWithDefaults({
  collections: [Users, Posts, Roles, Orders, Customers, Categories],
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
