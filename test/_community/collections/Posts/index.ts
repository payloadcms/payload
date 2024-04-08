import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { mediaSlug } from '../Media'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'json',
      schema: '{"test": "string"}',
      type: 'json',
    },
    {
      name: 'associatedMedia',
      access: {
        create: () => true,
        update: () => false,
      },
      relationTo: mediaSlug,
      type: 'upload',
    },
  ],
  slug: postsSlug,
}
