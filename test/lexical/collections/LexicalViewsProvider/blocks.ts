import type { Block } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

/**
 * Block containing a richtext field with views configured.
 * Used to test if nested richtext inherits currentView="frontend" from parent RichTextViewProvider.
 */
export const lexicalViewsProviderBlocks: Block[] = [
  {
    slug: 'content-block',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
      },
      {
        name: 'richText',
        type: 'richText',
        editor: lexicalEditor({
          features: ({ defaultFeatures }) => [...defaultFeatures],
          views: './collections/LexicalViewsProvider/views.js#lexicalProviderViews',
        }),
      },
    ],
    interfaceName: 'ContentBlock',
  },
]
