import type { Block } from 'payload'

export const lexicalViewsBlocks: Block[] = [
  {
    slug: 'viewsTestBlock',
    interfaceName: 'ViewsTestBlock',
    fields: [
      {
        name: 'text',
        type: 'text',
      },
    ],
  },
  {
    slug: 'customAdminComponentBlock',
    interfaceName: 'CustomAdminComponentBlock',
    fields: [
      {
        name: 'text',
        type: 'text',
      },
    ],
  },
]
