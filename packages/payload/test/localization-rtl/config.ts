import { devUser } from '../credentials';
import { localization } from './localization';
import { Users } from './collections/users';
import { Posts } from './collections/posts';
import { Roles } from './collections/roles';
import { Orders } from './collections/orders';
import { i18n } from './i18n';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { Categories } from './collections/categories';
import { Customers } from './collections/customers';
import type { Config } from '../../src/config/types';
import config2 from './fields/config';

const config1 = {
  collections: [Users, Posts, Roles, Orders, Customers, Categories],
  i18n,
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
};
const config = config2 as Partial<Config>
export default buildConfigWithDefaults(config);
