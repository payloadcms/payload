import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalViews2Slug } from '../../slugs.js'
import { lexicalViewsBlocks } from '../LexicalViews/blocks.js'

export const LexicalViews2: CollectionConfig = {
  slug: lexicalViews2Slug,
  labels: {
    singular: 'Lexical Views 2',
    plural: 'Lexical Views 2',
  },
  admin: {
    description:
      'This collection only has a single field with a single custom view. This is to test an issue where views were not updated when there is only one field and one view.',
  },
  fields: [
    {
      name: 'customView',
      type: 'richText',
      editor: lexicalEditor({
        views: './collections/LexicalViews2/views.js#lexicalViews',
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: lexicalViewsBlocks,
          }),
        ],
      }),
    },
  ],
}
