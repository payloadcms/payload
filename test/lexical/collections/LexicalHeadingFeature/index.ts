import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalHeadingFeatureSlug } from '../../slugs.js'

export const LexicalHeadingFeature: CollectionConfig = {
  slug: lexicalHeadingFeatureSlug,
  labels: {
    singular: 'Lexical Heading Feature',
    plural: 'Lexical Heading Feature',
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h4', 'h2'] }),
        ],
      }),
    },
  ],
}
