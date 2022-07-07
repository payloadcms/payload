import { openAccess } from '../../helpers/configHelpers';
import { buildTestConfig } from '../../helpers/buildTestConfig';

export default buildTestConfig({
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
