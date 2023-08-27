import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js';
import { devUser } from '../credentials.js';

export const pagesSlug = 'pages';

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
  ],
  plugins: [
    async (config) => ({
      ...config,
      collections: [
        ...config.collections || [],
        {
          slug: pagesSlug,
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
      ],
    }),
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
