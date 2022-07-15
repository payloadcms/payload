import { openAccess } from '../helpers/configHelpers';
import { buildConfig } from '../buildConfig';

export default buildConfig({
  collections: [{
    slug: 'posts',
    access: openAccess,
    fields: [
      {
        name: 'title',
        type: 'text',
      },
    ],
  }],
});
