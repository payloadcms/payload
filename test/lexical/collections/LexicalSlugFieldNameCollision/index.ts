import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalSlugFieldNameCollisionSlug } from '../../slugs.js'

// The slug and the rich text field name must stay equal to repro the bug.
export const LexicalSlugFieldNameCollision: CollectionConfig = {
  slug: lexicalSlugFieldNameCollisionSlug,
  labels: {
    singular: 'Lexical Slug Field Name Collision',
    plural: 'Lexical Slug Field Name Collision',
  },
  fields: [
    {
      name: lexicalSlugFieldNameCollisionSlug,
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
  ],
}
