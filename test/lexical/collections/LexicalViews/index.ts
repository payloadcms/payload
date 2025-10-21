import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  DebugJsxConverterFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { lexicalViewsSlug } from '../../slugs.js'
import { DebugViewsJSXConverterFeature } from './viewsJSXConverter/server/index.js'

export const LexicalViews: CollectionConfig = {
  slug: lexicalViewsSlug,
  labels: {
    singular: 'Lexical Views',
    plural: 'Lexical Views',
  },
  fields: [
    {
      name: 'customDefaultView',
      type: 'richText',
      editor: lexicalEditor({
        views: './collections/LexicalViews/views.js#lexicalViews',
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'viewsTestBlock',
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
          DebugViewsJSXConverterFeature({ type: 'default' }),
        ],
      }),
    },
    {
      name: 'customFrontendViews',
      type: 'richText',
      editor: lexicalEditor({
        views: './collections/LexicalViews/views.js#lexicalFrontendViews',
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'viewsTestBlock',
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
          DebugViewsJSXConverterFeature({ type: 'frontend' }),
        ],
      }),
    },
    {
      name: 'vanillaView',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'viewsTestBlock',
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
          DebugJsxConverterFeature(),
        ],
      }),
    },
  ],
}
