import type { CollectionConfig } from 'payload'

export const LocalizedPostsCollection: CollectionConfig = {
  slug: 'localized-posts',
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      localized: true,
      type: 'text',
    },
    {
      name: 'number',
      localized: true,
      type: 'number',
    },
    {
      name: 'select',
      type: 'select',
      options: ['a', 'b'],
    },
    {
      name: 'selectMany',
      type: 'select',
      options: ['a', 'b'],
      hasMany: true,
    },
    {
      name: 'group',
      localized: true,
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
    {
      name: 'groupSecond',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      localized: true,
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
    {
      name: 'arraySecond',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      localized: true,
      blocks: [
        {
          slug: 'intro',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'introText',
              type: 'text',
            },
          ],
        },
        {
          slug: 'cta',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'ctaText',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'blocksSecond',
      type: 'blocks',
      blocks: [
        {
          slug: 'first',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'firstText',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          slug: 'second',
          fields: [
            {
              name: 'text',
              type: 'text',
              localized: true,
            },
            {
              name: 'secondText',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
