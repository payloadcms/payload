import type { CollectionConfig } from 'payload'

export const groupSlug = 'groups'

export const Group: CollectionConfig = {
  slug: groupSlug,
  fields: [
    {
      name: 'groupLocalizedRow',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
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
