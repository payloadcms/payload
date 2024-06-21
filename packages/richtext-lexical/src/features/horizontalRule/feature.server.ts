// eslint-disable-next-line payload/no-imports-from-exports-dir
import { HorizontalRuleFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { createNode } from '../typeUtilities.js'
import { i18n } from './i18n.js'
import { MarkdownTransformer } from './markdownTransformer.js'
import { HorizontalRuleNode } from './nodes/HorizontalRuleNode.js'

export const HorizontalRuleFeature = createServerFeature({
  feature: {
    ClientFeature: HorizontalRuleFeatureClient,
    i18n,
    markdownTransformers: [MarkdownTransformer],
    nodes: [
      createNode({
        converters: {
          html: {
            converter: () => {
              return `<hr/>`
            },
            nodeTypes: [HorizontalRuleNode.getType()],
          },
        },
        node: HorizontalRuleNode,
      }),
    ],
  },
  key: 'horizontalRule',
})
