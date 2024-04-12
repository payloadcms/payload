import type { HTMLConverter } from '../converters/html/converter/types.js'
import type { FeatureProviderProviderServer } from '../types.js'
import type { SerializedHorizontalRuleNode } from './nodes/HorizontalRuleNode.js'

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
        clientFeatureProps: null,
        markdownTransformers: [MarkdownTransformer],
        nodes: [
          {
            converters: {
              html: {
                converter: () => {
                  return `<hr/>`
                },
                nodeTypes: [HorizontalRuleNode.getType()],
              } as HTMLConverter<SerializedHorizontalRuleNode>,
            },
            node: HorizontalRuleNode,
          },
        ],
        serverFeatureProps: props,
      }
    },
    key: 'horizontalrule',
    serverFeatureProps: props,
  }
}
