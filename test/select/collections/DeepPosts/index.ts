import type { CollectionConfig } from 'payload'

export const DeepPostsCollection: CollectionConfig = {
  slug: 'deep-posts',
  fields: [
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'group',
              type: 'group',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'number',
                  type: 'number',
                },
              ],
            },
          ],
        },
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block',
              fields: [
                {
                  type: 'text',
                  name: 'text',
                },
                {
                  type: 'number',
                  name: 'number',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'arrayTop',
      type: 'array',
      fields: [
        {
          type: 'text',
          name: 'text',
        },
        {
          type: 'array',
          name: 'arrayNested',
          fields: [
            {
              type: 'text',
              name: 'text',
            },
            {
              type: 'number',
              name: 'number',
            },
          ],
        },
      ],
    },
  ],
}
