import type { SerializedQuoteNode as _SerializedQuoteNode } from '@lexical/rich-text'
import type { Spread } from 'lexical'

import { QuoteNode } from '@lexical/rich-text'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../../converters/lexicalToHtml_deprecated/converter/index.js'
import { createNode } from '../../typeUtilities.js'
import { MarkdownTransformer } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export type SerializedQuoteNode = Spread<
  {
    type: 'quote'
  },
  _SerializedQuoteNode
>

export const BlockquoteFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#BlockquoteFeatureClient',
    clientFeatureProps: null,
    i18n,
    markdownTransformers: [MarkdownTransformer],
    nodes: [
      createNode({
        converters: {
          html: {
            converter: async ({
              converters,
              currentDepth,
              depth,
              draft,
              node,
              overrideAccess,
              parent,
              req,
              showHiddenFields,
            }) => {
              const childrenText = await convertLexicalNodesToHTML({
                converters,
                currentDepth,
                depth,
                draft,
                lexicalNodes: node.children,
                overrideAccess,
                parent: {
                  ...node,
                  parent,
                },
                req,
                showHiddenFields,
              })
              const style = [
                node.format ? `text-align: ${node.format};` : '',
                node.indent > 0 ? `padding-inline-start: ${node.indent * 40}px;` : '',
              ]
                .filter(Boolean)
                .join(' ')

              return `<blockquote${style ? ` style='${style}'` : ''}>${childrenText}</blockquote>`
            },
            nodeTypes: [QuoteNode.getType()],
          },
        },
        node: QuoteNode,
      }),
    ],
  },
  key: 'blockquote',
})
