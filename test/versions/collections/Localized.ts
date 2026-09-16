import type { CollectionConfig } from 'payload'

import { localizedCollectionSlug } from '../slugs.js'

const LocalizedPosts: CollectionConfig = {
  slug: localizedCollectionSlug,
  versions: {
    drafts: {},
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            if (!req.context.uppercaseLocalizedText) {
              return value
            }

            if (typeof value === 'string') {
              return value.toUpperCase()
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
              return Object.fromEntries(
                Object.entries(value).map(([locale, localeValue]) => [
                  locale,
                  typeof localeValue === 'string' ? localeValue.toUpperCase() : localeValue,
                ]),
              )
            }

            return value
          },
        ],
      },
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
