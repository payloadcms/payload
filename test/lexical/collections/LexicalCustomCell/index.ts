import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalCustomCellSlug } from '../../slugs.js'

export const LexicalCustomCell: CollectionConfig = {
  slug: lexicalCustomCellSlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'richTextField', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        components: {
          Cell: './components/CustomCell.js#CustomCell',
        },
      },
    },
    {
      name: 'richTextField',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        components: {
          Cell: './components/CustomCell.js#CustomCell',
        },
      },
    },
  ],
}
