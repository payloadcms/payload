import type { CollectionConfig } from 'payload'

import { TableFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const RichText: CollectionConfig = {
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          TableFeature(),
        ],
      }),
    },
  ],
  slug: 'richtext',
}
