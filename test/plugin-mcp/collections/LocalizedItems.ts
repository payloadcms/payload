import type { CollectionConfig } from 'payload'

export const LocalizedItems: CollectionConfig = {
  slug: 'localized-items',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    // Array field that is localized as a whole — each locale has its own rows
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'rel',
          type: 'relationship',
          relationTo: 'users',
        },
      ],
      localized: true,
    },
    // Non-localized array with a localized subfield — rows shared across locales,
    // so row ids must be preserved on update
    {
      name: 'rows',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
        },
        {
          name: 'rel',
          type: 'relationship',
          relationTo: 'users',
        },
      ],
    },
  ],
}
