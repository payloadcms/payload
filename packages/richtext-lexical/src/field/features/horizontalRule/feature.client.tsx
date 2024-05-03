'use client'

import { $isNodeSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { HorizontalRuleIcon } from '../../lexical/ui/icons/HorizontalRule/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { toolbarAddDropdownGroupWithItems } from '../shared/toolbar/addDropdownGroup.js'
import { MarkdownTransformer } from './markdownTransformer.js'
import {
  $isHorizontalRuleNode,
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from './nodes/HorizontalRuleNode.js'
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
            items: [
              {
                Icon: HorizontalRuleIcon,
                key: 'horizontalRule',
                keywords: ['hr', 'horizontal rule', 'line', 'separator'],
                label: `Horizontal Rule`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
                },
              },
            ],
            key: 'basic',
            label: 'Basic',
          },
        ],
      },
      toolbarFixed: {
        groups: [
          toolbarAddDropdownGroupWithItems([
            {
              ChildComponent: HorizontalRuleIcon,
              isActive: ({ selection }) => {
                if (!$isNodeSelection(selection) || !selection.getNodes().length) {
                  return false
                }

                const firstNode = selection.getNodes()[0]
                return $isHorizontalRuleNode(firstNode)
              },
              key: 'horizontalRule',
              label: `Horizontal Rule`,
              onSelect: ({ editor }) => {
                editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
              },
            },
          ]),
        ],
      },
    }),
  }
}

export const HorizontalRuleFeatureClientComponent = createClientComponent(
  HorizontalRuleFeatureClient,
)
