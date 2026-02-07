import type { Block } from 'payload'

export const lexicalViewsFrontendBlocks: Block[] = [
  {
    slug: 'viewsTestBlock',
    fields: [
      {
        name: 'text',
        type: 'text',
      },
    ],
    interfaceName: 'ViewsTestBlock',
  },
  {
    slug: 'banner',
    fields: [
      {
        name: 'type',
        type: 'select',
        defaultValue: 'normal',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Important', value: 'important' },
        ],
        required: true,
      },
      {
        name: 'title',
        type: 'text',
        required: true,
      },
      {
        name: 'content',
        type: 'richText',
      },
    ],
    interfaceName: 'BannerBlock',
  },
]
