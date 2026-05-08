import type { SerializedQuoteNode as _SerializedQuoteNode } from '@lexical/rich-text'
import type { SerializedLexicalNode } from 'lexical'

import { QuoteNode } from '@lexical/rich-text'

import type { StronglyTypedElementNode } from '../../../nodeTypes.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { MarkdownTransformer } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export type SerializedQuoteNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedQuoteNode, 'quote', T>

export const BlockquoteFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#BlockquoteFeatureClient',
    clientFeatureProps: null,
    i18n,
    markdownTransformers: [MarkdownTransformer],
    nodes: [
      createNode({
        node: QuoteNode,
      }),
    ],
  },
  key: 'blockquote',
})
