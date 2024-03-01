import type { HeadingTagType } from '@lexical/rich-text'

import { HeadingNode, type SerializedHeadingNode } from '@lexical/rich-text'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProviderProviderServer } from '../types'

import { convertLexicalNodesToHTML } from '../converters/html/converter'
import { HeadingFeatureClientComponent } from './feature.client'
import { MarkdownTransformer } from './markdownTransformer'

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
                converter: async ({ converters, node, parent }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
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
