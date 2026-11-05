import type { Block } from 'payload'

export const lexicalViewsBlocks: Block[] = [
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
]
