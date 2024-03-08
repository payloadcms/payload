import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

import { mediaSlug } from '../Media/index.js'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  admin: {
    useAsTitle: 'text',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
    {
      name: 'richText',
      type: 'richText',
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
