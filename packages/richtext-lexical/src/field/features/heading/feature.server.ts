import type { HeadingTagType, SerializedHeadingNode } from '@lexical/rich-text'

import lexicalRichTextImport from '@lexical/rich-text'
const { HeadingNode } = lexicalRichTextImport

import type { HTMLConverter } from '../converters/html/converter/types.js'
import type { FeatureProviderProviderServer } from '../types.js'

import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'
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

                  return '<' + node?.tag + '>' + childrenText + '</' + node?.tag + '>'
                },
                nodeTypes: [HeadingNode.getType()],
              },
            },
            node: HeadingNode,
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'heading',
    serverFeatureProps: props,
  }
}
