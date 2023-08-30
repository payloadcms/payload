import type { CollectionConfig } from '../../../../src/collections/config/types.js';

import { mediaSlug } from '../Media/index.js';

export const postsSlug = 'posts';

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'associatedMedia',
      type: 'upload',
      relationTo: mediaSlug,
      access: {
        create: () => true,
        update: () => false,
      },
    },
  ],
};
