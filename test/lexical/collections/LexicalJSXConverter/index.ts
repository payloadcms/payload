import type { CollectionConfig } from 'payload'

import { DebugJsxConverterFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalJSXConverterSlug } from '../../slugs.js'

export const LexicalJSXConverter: CollectionConfig = {
  slug: lexicalJSXConverterSlug,
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, DebugJsxConverterFeature()],
      }),
    },
  ],
}
