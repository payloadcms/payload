import type { CollectionConfig } from '../../../../src/collections/config/types';

export const postsSlug = 'posts';

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
};
