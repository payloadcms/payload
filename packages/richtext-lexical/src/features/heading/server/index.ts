import type {
  SerializedHeadingNode as _SerializedHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text'
import type { Spread } from 'lexical'

import { HeadingNode } from '@lexical/rich-text'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../../converters/lexicalToHtml_deprecated/converter/index.js'
import { createNode } from '../../typeUtilities.js'
import { MarkdownTransformer } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

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
      ClientFeature: '@payloadcms/richtext-lexical/client#HeadingFeatureClient',
      clientFeatureProps: props,
      i18n,
      markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
      nodes: [
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  currentDepth,
                  depth,
                  draft,
                  lexicalNodes: node.children,
                  overrideAccess,
                  parent: {
                    ...node,
                    parent,
                  },
                  req,
                  showHiddenFields,
                })
                const style = [
                  node.format ? `text-align: ${node.format};` : '',
                  node.indent > 0 ? `padding-inline-start: ${node.indent * 40}px;` : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return `<${node?.tag}${style ? ` style='${style}'` : ''}>${childrenText}</${node?.tag}>`
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
