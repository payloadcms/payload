import type { Block } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

/**
 * Block with richtext field that HAS views configured.
 * Parent richtext has NO views, so this nested richtext should keep its ViewSelector.
 */
export const lexicalNestedBlocks: Block[] = [
  {
    slug: 'nested-content',
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
      },
      {
        name: 'nestedRichText',
        type: 'richText',
        editor: lexicalEditor({
          features: ({ defaultFeatures }) => [...defaultFeatures],
          views: './collections/LexicalViewsNested/views.js#lexicalNestedViews',
        }),
      },
    ],
    interfaceName: 'NestedContentBlock',
  },
]
