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
        editor: lexicalEditor({
          features: ({ defaultFeatures }) => [...defaultFeatures],
        }),
      },
    ],
    interfaceName: 'ProviderBannerBlock',
  },
]
