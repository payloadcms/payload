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
    {
      slug: 'relation-a',
      labels: {
        singular: 'Relation A',
        plural: 'Relation As',
      },
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-b',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
    },
    {
      slug: 'relation-b',
      labels: {
        singular: 'Relation B',
        plural: 'Relation Bs',
      },
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-a',
        },
        {
          name: 'richText',
          type: 'richText',
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
