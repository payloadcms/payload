import type { CollectionConfig } from 'payload/types'

import { FixedToolbarFeature, lexicalEditor, TreeViewFeature } from '@payloadcms/richtext-lexical'

export const richTextSlug = 'richText'

export const RichTextCollection: CollectionConfig = {
  slug: richTextSlug,
  fields: [
    {
      name: 'lexical',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          TreeViewFeature(),
        ],
      }),
    },
  ],
}
