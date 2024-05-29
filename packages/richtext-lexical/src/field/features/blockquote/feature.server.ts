import { QuoteNode } from '@lexical/rich-text'

import type { FeatureProviderProviderServer } from '../types.js'

import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'
import { BlockquoteFeatureClientComponent } from './feature.client.js'
import { i18n } from './i18n.js'
import { MarkdownTransformer } from './markdownTransformer.js'

export const BlockquoteFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: BlockquoteFeatureClientComponent,
        clientFeatureProps: null,
        i18n,
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
