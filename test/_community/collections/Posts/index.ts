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
    {
      name: 'blocksField',
      type: 'blocks',
      blocks: [
        {
          slug: 'block1',
          fields: [
            {
              type: 'group',
              name: 'group1',
              fields: [
                {
                  type: 'text',
                  name: 'group1Text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  slug: postsSlug,
}
