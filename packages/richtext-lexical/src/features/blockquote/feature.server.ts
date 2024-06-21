import { QuoteNode } from '@lexical/rich-text'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { BlockquoteFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'
import { i18n } from './i18n.js'
import { MarkdownTransformer } from './markdownTransformer.js'

export const BlockquoteFeature = createServerFeature({
  feature: {
    ClientFeature: BlockquoteFeatureClient,
    clientFeatureProps: null,
    i18n,
    markdownTransformers: [MarkdownTransformer],
    nodes: [
      createNode({
        converters: {
          html: {
            converter: async ({ converters, node, parent, req }) => {
              const childrenText = await convertLexicalNodesToHTML({
                converters,
                lexicalNodes: node.children,
                parent: {
                  ...node,
                  parent,
                },
                req,
              })

              return `<blockquote>${childrenText}</blockquote>`
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
