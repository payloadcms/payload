import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  type DefaultNodeTypes,
  lexicalEditor,
  type SerializedBlockNode,
} from '@payloadcms/richtext-lexical'

import type { BannerBlock, ViewsTestBlock } from '../../payload-types.js'

import { lexicalViewsFrontendSlug } from '../../slugs.js'
import { DebugViewsJSXConverterFeature } from '../LexicalViews/viewsJSXConverter/server/index.js'
import { lexicalViewsFrontendBlocks } from './blocks.js'

export type LexicalViewsFrontendNodes =
  | DefaultNodeTypes
  | SerializedBlockNode<BannerBlock | ViewsTestBlock>

export const LexicalViewsFrontend: CollectionConfig = {
  slug: lexicalViewsFrontendSlug,
  fields: [
    {
      name: 'customFrontendViews',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: lexicalViewsFrontendBlocks,
          }),
          DebugViewsJSXConverterFeature({ type: 'frontend' }),
        ],
        views: './collections/LexicalViewsFrontend/views.js#lexicalFrontendViews',
      }),
    },
  ],
  labels: {
    plural: 'Lexical Views Frontend',
    singular: 'Lexical Views Frontend',
  },
}
