import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalHeadingFeatureDisabledSlug } from '../../slugs.js'

export const LexicalHeadingFeatureDisabled: CollectionConfig = {
  slug: lexicalHeadingFeatureDisabledSlug,
  labels: {
    singular: 'Lexical Heading Feature Disabled',
    plural: 'Lexical Heading Feature Disabled',
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          HeadingFeature({ enabledHeadingSizes: [] }), // All headings disabled
        ],
      }),
    },
  ],
}
