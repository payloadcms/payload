import type { CollectionConfig } from 'payload/types'

import { lexicalEditor, TreeViewFeature } from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

export const richTextSlug = 'richText'

export const RichTextCollection: CollectionConfig = {
  slug: richTextSlug,
  fields: [
    {
      type: 'richText',
      name: 'richText',
      label: 'Rich Text',
      localized: true,
      editor: slateEditor({
        admin: {
          elements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        },
      }),
    },
    {
      name: 'lexical',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, TreeViewFeature()],
      }),
    },
  ],
}
