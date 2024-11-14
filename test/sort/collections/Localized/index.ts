import type { CollectionConfig } from 'payload'

export const localiedSlug = 'localized'

export const LocalizedCollection: CollectionConfig = {
  slug: localiedSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
    {
      name: 'number',
      type: 'number',
      localized: true,
    },
    {
      name: 'number2',
      type: 'number',
    },
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
          localized: true,
        },
      ],
    },
  ],
}
