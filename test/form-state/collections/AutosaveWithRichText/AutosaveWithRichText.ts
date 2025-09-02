import type { CollectionConfig } from 'payload'

import { lexicalEditor, RelationshipFeature } from '@payloadcms/richtext-lexical'

export const autosaveWithRichTextSlug = 'autosave-with-richtext'

export const AutosaveWithRichTextCollection: CollectionConfig = {
  slug: autosaveWithRichTextSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'richTextWithRelationship',
      type: 'richText',
      editor: lexicalEditor({
        features: () => [
          RelationshipFeature({
            enabledCollections: ['posts'],
          }),
        ],
      }),
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
