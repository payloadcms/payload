import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import GlobalViewWithRefresh from './GlobalViewWithRefresh';

export const pagesSlug = 'pages';

export default buildConfig({
  globals: [
    {
      slug: 'settings',
      fields: [
        {
          type: 'checkbox',
          name: 'test',
          label: 'Allow access to test global',
        },
      ],
      admin: {
        components: {
          views: {
            Edit: GlobalViewWithRefresh,
          },
        },
      },
    },
    {
      slug: 'test',
      fields: [],
      access: {
        read: async ({ req: { payload } }) => {
          const access = await payload.findGlobal({ slug: 'settings' });
          return access.test;
        },
      },
    },
  ],
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
  ],
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
