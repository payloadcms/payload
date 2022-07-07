import { buildTestConfig } from '../../helpers/buildTestConfig';

export default buildTestConfig({
  collections: [{
    slug: 'posts',
    fields: [
      {
        name: 'title',
        type: 'text',
      },
      {
        name: 'description',
        type: 'text',
      },
    ],
  }],
});
