import type { CollectionConfig } from 'payload'

import { richTextCollectionSlug } from '../slugs.js'

export const RichText: CollectionConfig = {
  slug: richTextCollectionSlug,
  admin: {
    components: {
      views: {
        edit: {
          version: {
            diffComponents: {
              richText: './elements/RichTextDiffComponent/index.js#RichTextDiffComponent',
            },
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'richtext',
      type: 'richText',
    },
  ],
  versions: {
    maxPerDoc: 35,
  },
}
