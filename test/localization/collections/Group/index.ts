import type { CollectionConfig } from 'payload/types'

export const groupSlug = 'groups'

export const Group: CollectionConfig = {
  slug: groupSlug,
  fields: [
    {
      name: 'groupLocalized',
      localized: true,
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          localized: true,
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      name: 'deep',
      type: 'group',
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              localized: true,
              type: 'text',
              name: 'title',
            },
          ],
        },
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'first',
              fields: [
                {
                  localized: true,
                  type: 'text',
                  name: 'title',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
