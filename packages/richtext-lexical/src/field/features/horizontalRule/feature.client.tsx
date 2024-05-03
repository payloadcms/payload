'use client'

import type { FeatureProviderProviderClient } from '../types.js'

import { HorizontalRuleIcon } from '../../lexical/ui/icons/HorizontalRule/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { MarkdownTransformer } from './markdownTransformer.js'
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from './nodes/HorizontalRuleNode.js'
import { HorizontalRulePlugin } from './plugin/index.js'

const HorizontalRuleFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      markdownTransformers: [MarkdownTransformer],
      nodes: [HorizontalRuleNode],
      plugins: [
        {
          Component: HorizontalRulePlugin,
          position: 'normal',
        },
      ],
      slashMenu: {
        groups: [
          {
            displayName: 'Basic',
            items: [
              {
                Icon: HorizontalRuleIcon,
                displayName: `Horizontal Rule`,
                key: 'horizontalRule',
                keywords: ['hr', 'horizontal rule', 'line', 'separator'],
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
                },
              },
            ],
            key: 'basic',
          },
        ],
      },
    }),
  }
}

export const HorizontalRuleFeatureClientComponent = createClientComponent(
  HorizontalRuleFeatureClient,
)
