import { buildConfig } from '../buildConfig';

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
});
