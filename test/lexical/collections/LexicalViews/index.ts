import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  type DefaultNodeTypes,
  lexicalEditor,
  type SerializedBlockNode,
} from '@payloadcms/richtext-lexical'

import type { CustomAdminComponentBlock, ViewsTestBlock } from '../../payload-types.js'

import { lexicalViewsSlug } from '../../slugs.js'
import { lexicalViewsBlocks } from './blocks.js'
import { DebugViewsJSXConverterFeature } from './viewsJSXConverter/server/index.js'

export type LexicalViewsNodes =
  | DefaultNodeTypes
  | SerializedBlockNode<CustomAdminComponentBlock | ViewsTestBlock>

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
            blocks: lexicalViewsBlocks,
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
            blocks: lexicalViewsBlocks,
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
            blocks: lexicalViewsBlocks,
          }),
        ],
      }),
    },
  ],
}
