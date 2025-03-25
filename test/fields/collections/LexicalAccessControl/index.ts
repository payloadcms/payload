import type { CollectionConfig } from 'payload'

import { defaultEditorFeatures, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalAccessControlSlug } from '../../slugs.js'

export const LexicalAccessControl: CollectionConfig = {
  slug: lexicalAccessControlSlug,
  access: {
    read: () => true,
    create: () => false,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: [...defaultEditorFeatures],
      }),
    },
  ],
}
