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
    slug: 'customAdminComponentBlock',
    fields: [
      {
        name: 'text',
        type: 'text',
      },
    ],
    interfaceName: 'CustomAdminComponentBlock',
  },
]
