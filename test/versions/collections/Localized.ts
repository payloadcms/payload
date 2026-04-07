import type { CollectionConfig } from 'payload'

import { localizedCollectionSlug } from '../slugs.js'

const LocalizedPosts: CollectionConfig = {
  slug: localizedCollectionSlug,
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'text',
      localized: true,
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'block',
          fields: [
            {
              name: 'array',
              type: 'array',
              localized: true,
              fields: [
                {
                  name: 'relationship',
                  type: 'relationship',
                  relationTo: 'posts',
                  localized: true,
                },
              ],
            },
          ],
        },
        {
          slug: 'localizedTextBlock',
          fields: [
            {
              name: 'blockText',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
}

export default LocalizedPosts
