import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { i18n } from './i18n.js'
import { PAYLOAD_HORIZONTAL_RULE } from './markdownTransformer.js'
import { HorizontalRuleServerNode } from './nodes/HorizontalRuleNode.js'
import { horizontalRuleNodeJSONSchema } from './schema.js'

export type { SerializedHorizontalRuleNode } from './schema.js'

export const HorizontalRuleFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient',
    i18n,
    markdownTransformers: [PAYLOAD_HORIZONTAL_RULE],
    nodes: [
      createNode({
        jsonSchema: horizontalRuleNodeJSONSchema,
        node: HorizontalRuleServerNode,
      }),
    ],
  },
  key: 'horizontalRule',
})
