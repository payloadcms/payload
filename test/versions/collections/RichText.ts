import type { CollectionConfig } from 'payload'

import { richTextCollectionSlug } from '../slugs.js'

export const RichText: CollectionConfig = {
  slug: richTextCollectionSlug,
  fields: [
    {
      name: 'richtext',
      type: 'richText',
      admin: {
        components: {
          Diff: './elements/RichTextDiffComponent/index.js#RichTextDiffComponent',
        },
      },
    },
  ],
  versions: {
    maxPerDoc: 35,
  },
}
