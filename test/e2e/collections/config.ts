import { buildConfig } from '../buildConfig';

export default buildConfig({
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
