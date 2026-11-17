import type { CollectionConfig } from 'payload'

import { writeInputSlug } from '../../shared.js'

export const WriteInput: CollectionConfig = {
  slug: writeInputSlug,
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        {
          slug: 'content',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [
                {
                  name: 'settings',
                  type: 'group',
                  fields: [{ name: 'label', type: 'text' }],
                },
                {
                  name: 'translations',
                  type: 'group',
                  localized: true,
                  fields: [{ name: 'label', type: 'text' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  versions: true,
}
