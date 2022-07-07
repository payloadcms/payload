import { buildConfig } from '../buildConfig';
import { credentials } from '../helpers';

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      slug: 'nav',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    });
  },
});
