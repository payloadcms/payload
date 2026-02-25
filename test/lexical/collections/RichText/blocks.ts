import type { Block } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const TextBlock: Block = {
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
  slug: 'textRequired',
}

export const UploadAndRichTextBlock: Block = {
  fields: [
    {
      name: 'upload',
      type: 'upload',
      relationTo: 'uploads',
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor(),
    },
  ],
  slug: 'uploadAndRichText',
}

export const RelationshipBlock: Block = {
  fields: [
    {
      name: 'rel',
      type: 'relationship',
      relationTo: 'uploads',
      required: true,
    },
  ],
  slug: 'relationshipBlock',
}

export const SelectFieldBlock: Block = {
  fields: [
    {
      name: 'select',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: 'option1',
        },
        {
          label: 'Option 2',
          value: 'option2',
        },
        {
          label: 'Option 3',
          value: 'option3',
        },
        {
          label: 'Option 4',
          value: 'option4',
        },
        {
          label: 'Option 5',
          value: 'option5',
        },
      ],
    },
  ],
  slug: 'select',
}
