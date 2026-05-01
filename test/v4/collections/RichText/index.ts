import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { richTextFieldsSlug } from '../../slugs.js'

const RichTextFields: CollectionConfig = {
  slug: richTextFieldsSlug,
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
    {
      name: 'typography',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
  ],
}

export default RichTextFields
