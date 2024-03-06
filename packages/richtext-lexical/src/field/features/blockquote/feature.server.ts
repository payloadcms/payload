import { QuoteNode, type SerializedQuoteNode } from '@lexical/rich-text'

import type { HTMLConverter } from '../converters/html/converter/types.js'
import type { FeatureProviderProviderServer } from '../types.js'

import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
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
          {
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
              } as HTMLConverter<SerializedQuoteNode>,
            },
            node: QuoteNode,
          },
        ],
        serverFeatureProps: props,
      }
    },
    key: 'blockquote',
    serverFeatureProps: props,
  }
}
