import type {
  SerializedHeadingNode as _SerializedHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text'
import type { Spread } from 'lexical'

import { HeadingNode } from '@lexical/rich-text'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { HeadingFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'
import { i18n } from './i18n.js'
import { MarkdownTransformer } from './markdownTransformer.js'

export type SerializedHeadingNode = Spread<
  {
    type: 'heading'
  },
  _SerializedHeadingNode
>

export type HeadingFeatureProps = {
  enabledHeadingSizes?: HeadingTagType[]
}

export const HeadingFeature = createServerFeature<
  HeadingFeatureProps,
  HeadingFeatureProps,
  HeadingFeatureProps
>({
  feature: ({ props }) => {
    if (!props) {
      props = {}
    }

    const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

    return {
      ClientFeature: HeadingFeatureClient,
      clientFeatureProps: props,
      i18n,
      markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
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

                return '<' + node?.tag + '>' + childrenText + '</' + node?.tag + '>'
              },
              nodeTypes: [HeadingNode.getType()],
            },
          },
          node: HeadingNode,
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'heading',
})
