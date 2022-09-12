import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'owner',
          type: 'relationship',
          relationTo: 'users',
          hooks: {
            beforeChange: [
              ({ req: { user } }) => user?.id,
            ],
          },
        },

      ],
    },
  ],
  onInit: async (payload) => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    await payload.create({
      user,
      collection: 'posts',
      data: postDoc,
    });
  },
});

export const postDoc = {
  title: 'test post',
};
