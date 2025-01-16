import type { CollectionConfig } from 'payload'

export const tabSlug = 'tabs'

export const Tab: CollectionConfig = {
  slug: tabSlug,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'tabLocalized',
          localized: true,
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'array',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'tab',
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
    },
  ],
}
