import type { CollectionConfig } from 'payload'

import { EXPERIMENTAL_TableFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const RichText: CollectionConfig = {
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
        ],
      }),
    },
  ],
  slug: 'richtext',
}
