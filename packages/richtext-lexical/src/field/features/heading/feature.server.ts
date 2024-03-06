import type { HeadingTagType } from '@lexical/rich-text'

import { HeadingNode, type SerializedHeadingNode } from '@lexical/rich-text'

import type { HTMLConverter } from '../converters/html/converter/types.js'
import type { FeatureProviderProviderServer } from '../types.js'

import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { HeadingFeatureClientComponent } from './feature.client.js'
import { MarkdownTransformer } from './markdownTransformer.js'

export type HeadingFeatureProps = {
  enabledHeadingSizes?: HeadingTagType[]
}

export const HeadingFeature: FeatureProviderProviderServer<
  HeadingFeatureProps,
  HeadingFeatureProps
> = (props) => {
  if (!props) {
    props = {}
  }

  const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

  return {
    feature: () => {
      return {
        ClientComponent: HeadingFeatureClientComponent,
        markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
        nodes: [
          {
            type: HeadingNode.getType(),
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

                  return '<' + node?.tag + '>' + childrenText + '</' + node?.tag + '>'
                },
                nodeTypes: [HeadingNode.getType()],
              } as HTMLConverter<SerializedHeadingNode>,
            },
            node: HeadingNode,
          },
        ],
        serverFeatureProps: props,
      }
    },
    key: 'heading',
    serverFeatureProps: props,
  }
}
