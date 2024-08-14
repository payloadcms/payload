'use client'

import { $isNodeSelection } from 'lexical'

import { HorizontalRuleIcon } from '../../../lexical/ui/icons/HorizontalRule/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { slashMenuBasicGroupWithItems } from '../../shared/slashMenu/basicGroup.js'
import { toolbarAddDropdownGroupWithItems } from '../../shared/toolbar/addDropdownGroup.js'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '../server/nodes/HorizontalRuleNode.js'
import { MarkdownTransformer } from './markdownTransformer.js'
import { $isHorizontalRuleNode, HorizontalRuleNode } from './nodes/HorizontalRuleNode.js'
import { HorizontalRulePlugin } from './plugin/index.js'

export const HorizontalRuleFeatureClient = createClientFeature({
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
})
