import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  type DefaultNodeTypes,
  lexicalEditor,
  type SerializedBlockNode,
} from '@payloadcms/richtext-lexical'

import type { ViewsTestBlock } from '../../payload-types.js'

import { lexicalViewsSlug } from '../../slugs.js'
import { lexicalViewsBlocks } from './blocks.js'
import { DebugViewsJSXConverterFeature } from './viewsJSXConverter/server/index.js'

export type LexicalViewsNodes = DefaultNodeTypes | SerializedBlockNode<ViewsTestBlock>

export const LexicalViews: CollectionConfig = {
  slug: lexicalViewsSlug,
  fields: [
    {
      name: 'customDefaultView',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: lexicalViewsBlocks,
          }),
          DebugViewsJSXConverterFeature({ type: 'default' }),
        ],
        views: './collections/LexicalViews/views.js#lexicalViews',
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
  labels: {
    plural: 'Lexical Views',
    singular: 'Lexical Views',
  },
}
