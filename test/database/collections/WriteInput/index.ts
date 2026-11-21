import type { CollectionConfig } from 'payload'

import { postsSlug, writeInputSlug } from '../../shared.js'

export const WriteInput: CollectionConfig = {
  slug: writeInputSlug,
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'reference', type: 'relationship', relationTo: [postsSlug] },
        {
          name: 'localizedReference',
          type: 'relationship',
          relationTo: [postsSlug],
          localized: true,
        },
      ],
    },
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
