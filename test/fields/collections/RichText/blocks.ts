import type { Block } from '../../../../packages/payload/types'

import { createLexical } from '../../../../packages/richtext-lexical/src'

export const TextBlock: Block = {
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
  slug: 'text',
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
      editor: createLexical({}),
    },
  ],
  slug: 'text',
}
