import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

import { mediaSlug } from '../Media/index.js'
import { CollapsibleLabel } from './CollapsibleLabel.js'
import { RowLabel } from './RowLabel.js'

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
    {
      name: 'richText',
      type: 'richText',
    },
    {
      name: 'relationship',
      type: 'relationship',
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
    {
      type: 'collapsible',
      fields: [],
      label: 'CollapsibleLabel',
    },
    {
      name: 'tester',
      type: 'array',
      admin: {
        components: {
          RowLabel,
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
