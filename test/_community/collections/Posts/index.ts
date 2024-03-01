import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { mediaSlug } from '../Media'
import { MyAPIAction } from './APIAction'
import { MyAction } from './Action'
import { MyListAction } from './ListAction'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  admin: {
    components: {
      views: {
        Edit: {
          Default: {
            actions: [MyAction],
          },
          API: {
            actions: [MyAPIAction],
          },
        },
        List: {
          actions: [MyListAction],
        },
      },
    },
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
  versions: true,
  slug: postsSlug,
}
