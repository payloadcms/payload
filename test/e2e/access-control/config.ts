import { buildConfig } from '../buildConfig';

export const slug = 'access-controls';

export default buildConfig({
  collections: [
    {
      slug,
      fields: [
        {
          name: 'restrictedField',
          type: 'text',
          access: {
            read: () => false,
          },
        },
      ],
    },
    {
      slug: 'restricted',
      fields: [],
      access: {
        read: () => false,
      },
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: slug,
      data: {
        restrictedField: 'restricted',
      },
    });
  },

});
