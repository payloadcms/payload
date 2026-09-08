import type { CollectionConfig } from 'payload'

import { lexicalEditor, TableFeature } from '@payloadcms/richtext-lexical'

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
        features: ({ rootFeatures }) => [...rootFeatures, TableFeature()],
      }),
      admin: {
        hidden: true,
      },
    },
  ],
  versions: false,
}
