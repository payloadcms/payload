'use client'

import type { FeatureProviderProviderClient } from '../types.js'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
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
        options: [
          {
            displayName: 'Basic',
            key: 'basic',
            options: [
              new SlashMenuOption(`horizontalrule`, {
                Icon: HorizontalRuleIcon,
                displayName: `Horizontal Rule`,
                keywords: ['hr', 'horizontal rule', 'line', 'separator'],
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
                },
              }),
            ],
          },
        ],
      },
    }),
  }
}

export const HorizontalRuleFeatureClientComponent = createClientComponent(
  HorizontalRuleFeatureClient,
)
