'use client'

import type { ClientTranslationKeys } from '@payloadcms/translations'

import { $isNodeSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { HorizontalRuleIcon } from '../../lexical/ui/icons/HorizontalRule/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { slashMenuBasicGroupWithItems } from '../shared/slashMenu/basicGroup.js'
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
          slashMenuBasicGroupWithItems([
            {
              Icon: HorizontalRuleIcon,
              key: 'horizontalRule',
              keywords: ['hr', 'horizontal rule', 'line', 'separator'],
              label: ({ i18n }) => {
                return i18n.t('lexical:horizontalRule:label')
              },

              onSelect: ({ editor }) => {
                editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
              },
            },
          ]),
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
              label: ({ i18n }) => {
                return i18n.t('lexical:horizontalRule:label')
              },
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
