import type { CollectionConfig } from 'payload'

import { fallbackValuesSlug } from '../../shared.js'

export const FallbackValues: CollectionConfig = {
  slug: fallbackValuesSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'json', type: 'json' },
    {
      name: 'rows',
      type: 'array',
      fields: [
        {
          name: 'children',
          type: 'array',
          fields: [
            {
              name: 'code',
              type: 'text',
              access: { update: () => false },
              defaultValue: 'default',
            },
          ],
        },
      ],
    },
  ],
  versions: { drafts: true },
}
