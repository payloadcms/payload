import { QuoteNode, type SerializedQuoteNode } from '@lexical/rich-text'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProviderProviderServer } from '../types'

import { convertLexicalNodesToHTML } from '../converters/html/converter'
import { BlockQuoteFeatureClientComponent } from './feature.client'
import { MarkdownTransformer } from './markdownTransformer'

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
                converter: async ({ converters, node, parent }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
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
