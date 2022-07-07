import { buildTestConfig } from '../../helpers/buildTestConfig';

export default buildTestConfig({
  collections: [{
    slug: 'posts',
    fields: [
      {
        name: 'title',
        type: 'text',
      },
    ],
  }],
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
