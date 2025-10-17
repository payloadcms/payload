import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalViewsSlug } from '../../slugs.js'

export const LexicalViews: CollectionConfig = {
  slug: lexicalViewsSlug,
  labels: {
    singular: 'Lexical Views',
    plural: 'Lexical Views',
  },
  fields: [
    {
      name: 'customViews',
      type: 'richText',
      editor: lexicalEditor({
        views: './collections/LexicalViews/views.js#lexicalViews',
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
  ],
}
