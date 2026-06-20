import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalLinkAutosaveSlug } from '../../slugs.js'

export const LexicalLinkAutosave: CollectionConfig = {
  slug: lexicalLinkAutosaveSlug,
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
  ],
}
