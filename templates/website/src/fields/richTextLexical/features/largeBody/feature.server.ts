import type { FeatureProviderProviderServer } from '@payloadcms/richtext-lexical'

import { convertLexicalNodesToHTML, createNode } from '@payloadcms/richtext-lexical'

import { LargeBodyFeatureClientComponent } from './feature.client'
import { LargeBodyNode } from './nodes/LargeBodyNode'

export const LargeBodyFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: LargeBodyFeatureClientComponent,
        clientFeatureProps: props,
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

                  return '<p class="rich-text-large-body">' + childrenText + '</p>'
                },
                nodeTypes: [LargeBodyNode.getType()],
              },
            },
            node: LargeBodyNode,
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'largeBody',
    serverFeatureProps: props,
  }
}
