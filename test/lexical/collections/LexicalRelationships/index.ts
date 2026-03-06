import type { CollectionConfig } from 'payload'

import {
  defaultEditorFeatures,
  FixedToolbarFeature,
  lexicalEditor,
  RelationshipFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

import { lexicalRelationshipFieldsSlug } from '../../slugs.js'

export const LexicalRelationshipsFields: CollectionConfig = {
  slug: lexicalRelationshipFieldsSlug,
  access: {
    read: () => true,
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          ...defaultEditorFeatures,
          RelationshipFeature({
            enabledCollections: ['array-fields'],
          }),
          UploadFeature({
            enabledCollections: ['uploads'],
          }),
        ],
      }),
    },
    {
      name: 'richText2',
      type: 'richText',
      editor: lexicalEditor({
        features: [...defaultEditorFeatures, RelationshipFeature(), FixedToolbarFeature()],
      }),
    },
    {
      name: 'richText3',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          ...defaultEditorFeatures,
          UploadFeature({
            disabledCollections: ['uploads'],
          }),
        ],
      }),
    },
    {
      name: 'richTextLocalized',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: [
          ...defaultEditorFeatures,
          RelationshipFeature({
            enabledCollections: ['array-fields'],
          }),
          UploadFeature({
            enabledCollections: ['uploads'],
          }),
        ],
      }),
    },
  ],
}
