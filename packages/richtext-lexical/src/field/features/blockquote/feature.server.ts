import lexicalRichTextImport from '@lexical/rich-text'
const { QuoteNode } = lexicalRichTextImport

import type { FeatureProviderProviderServer } from '../types.js'

import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'
import { BlockQuoteFeatureClientComponent } from './feature.client.js'
import { MarkdownTransformer } from './markdownTransformer.js'

export const BlockQuoteFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: BlockQuoteFeatureClientComponent,
        clientFeatureProps: null,
        markdownTransformers: [MarkdownTransformer],
        nodes: [
          createNode({
            converters: {
              html: {
                converter: async ({ converters, node, parent, payload }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
                    payload,
                  })

                  return `<blockquote>${childrenText}</blockquote>`
                },
                nodeTypes: [QuoteNode.getType()],
              },
            },
            node: QuoteNode,
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'blockquote',
    serverFeatureProps: props,
  }
}
