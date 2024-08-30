import type { CollectionConfig } from 'payload'

export const NestedArray: CollectionConfig = {
  slug: 'nested-arrays',
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'My Tab',
          fields: [
            {
              name: 'arrayWithBlocks',
              type: 'array',
              localized: true,
              fields: [
                {
                  name: 'blocksWithinArray',
                  type: 'blocks',
                  blocks: [
                    {
                      slug: 'someBlock',
                      fields: [
                        {
                          name: 'relationWithinBlock',
                          type: 'relationship',
                          relationTo: 'localized-posts',
                        },
                        {
                          name: 'myGroup',
                          type: 'group',
                          fields: [
                            {
                              name: 'text',
                              type: 'text',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'arrayWithLocalizedRelation',
              type: 'array',
              fields: [
                {
                  name: 'localizedRelation',
                  type: 'relationship',
                  localized: true,
                  relationTo: 'localized-posts',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
