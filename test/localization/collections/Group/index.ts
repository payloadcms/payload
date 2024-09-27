import type { CollectionConfig } from 'payload/types'

export const groupSlug = 'groups'

export const Group: CollectionConfig = {
  slug: groupSlug,
  fields: [
    {
      name: 'groupLocalized',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      localized: true,
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
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
              name: 'title',
              type: 'text',
              localized: true,
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
                  name: 'title',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
