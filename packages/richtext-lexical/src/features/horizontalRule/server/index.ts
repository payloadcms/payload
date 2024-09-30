import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { i18n } from './i18n.js'
import { MarkdownTransformer } from './markdownTransformer.js'
import { HorizontalRuleServerNode } from './nodes/HorizontalRuleNode.js'

export const HorizontalRuleFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient',
    i18n,
    markdownTransformers: [MarkdownTransformer],
    nodes: [
      createNode({
        converters: {
          html: {
            converter: () => {
              return `<hr/>`
            },
            nodeTypes: [HorizontalRuleServerNode.getType()],
          },
        },
        node: HorizontalRuleServerNode,
      }),
    ],
  },
  key: 'horizontalRule',
})
