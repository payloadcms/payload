import { buildConfig } from '../buildConfig';

export const slug = 'access-controls';

export default buildConfig({
  collections: [
    {
      slug: 'restricted',
      fields: [],
      access: {
        read: () => false,
      },
    },
  ],
});
