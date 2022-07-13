import { buildConfig } from '../buildConfig';
import { devUser } from '../../credentials';
import { textDoc } from './shared';

export default buildConfig({
  collections: [
    {
      slug: 'text-fields',
      admin: {
        useAsTitle: 'text',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
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

    await payload.create({
      collection: 'text-fields',
      data: textDoc,
    });
  },
});
