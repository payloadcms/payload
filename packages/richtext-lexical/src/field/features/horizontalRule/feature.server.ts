import type { FeatureProviderProviderServer } from '../types.js'

import { createNode } from '../typeUtilities.js'
import { HorizontalRuleFeatureClientComponent } from './feature.client.js'
import { MarkdownTransformer } from './markdownTransformer.js'
import { HorizontalRuleNode } from './nodes/HorizontalRuleNode.js'

export const HorizontalRuleFeature: FeatureProviderProviderServer<undefined, undefined> = (
  props,
) => {
  return {
    feature: () => {
      return {
        ClientComponent: HorizontalRuleFeatureClientComponent,
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
        serverFeatureProps: props,
      }
    },
    key: 'horizontalRule',
    serverFeatureProps: props,
  }
}
