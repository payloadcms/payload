import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

import { mediaSlug } from '../Media/index.js'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    // {
    //   name: 'richText',
    //   type: 'richText',
    // },
    {
      name: 'relationship',
      type: 'relationship',
      filterOptions: ({ id }) => {
        return {
          where: [
            {
              id: {
                not_equals: id,
              },
            },
          ],
        }
      },
      relationTo: ['posts'],
    },
    {
      name: 'associatedMedia',
      type: 'upload',
      access: {
        create: () => true,
        update: () => false,
      },
      relationTo: mediaSlug,
    },
    {
      name: 'blocksField',
      type: 'blocks',
      blocks: [
        {
          slug: 'block1',
          fields: [
            {
              name: 'group1',
              type: 'group',
              fields: [
                {
                  name: 'group1Text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
