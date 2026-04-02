import type { CollectionConfig } from 'payload'

import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const OnDemandOutsideForm: CollectionConfig = {
  slug: 'OnDemandOutsideForm',
  fields: [
    {
      name: 'json',
      type: 'json',
      admin: {
        components: {
          Field: './collections/OnDemandOutsideForm/Component.js#Component',
        },
      },
    },
    {
      name: 'hiddenAnchor',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [...rootFeatures, EXPERIMENTAL_TableFeature()],
      }),
      admin: {
        hidden: true,
      },
    },
  ],
}
