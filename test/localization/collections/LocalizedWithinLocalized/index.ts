import type { CollectionConfig } from 'payload'

export const LocalizedWithinLocalized: CollectionConfig = {
  slug: 'localized-within-localized',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'myTab',
          label: 'My Tab',
          localized: true,
          fields: [
            {
              name: 'shouldNotBeLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'myArray',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'shouldNotBeLocalized',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'myBlocks',
      type: 'blocks',
      localized: true,
      blocks: [
        {
          slug: 'myBlock',
          fields: [
            {
              name: 'shouldNotBeLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'myGroup',
      type: 'group',
      localized: true,
      fields: [
        {
          name: 'shouldNotBeLocalized',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
}
