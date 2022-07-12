import { openAccess } from '../../helpers/configHelpers';
import { buildConfig } from '../buildConfig';

export interface Post {
  id: string
  title: string
  description?: string
}

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
