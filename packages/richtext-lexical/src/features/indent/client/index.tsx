'use client'

import type { ElementNode, LexicalNode } from 'lexical'

import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { $findMatchingParent } from '@lexical/utils'
import {
  $isElementNode,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { PluginComponent } from '../../typesClient.js'

import { IndentDecreaseIcon } from '../../../lexical/ui/icons/IndentDecrease/index.js'
import { IndentIncreaseIcon } from '../../../lexical/ui/icons/IndentIncrease/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarIndentGroupWithItems } from './toolbarIndentGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarIndentGroupWithItems([
    {
      ChildComponent: IndentDecreaseIcon,
      isActive: () => false,
      isEnabled: ({ selection }) => {
        const nodes = selection?.getNodes()
        if (!nodes?.length) {
          return false
        }
        let atLeastOneNodeCanOutdent = false
        const isIndentable = (node: LexicalNode): node is ElementNode =>
          $isElementNode(node) && node.canIndent()
        for (const node of nodes) {
          if (isIndentable(node)) {
            if (node.getIndent() <= 0) {
              return false
            } else {
              atLeastOneNodeCanOutdent = true
            }
          }
        }
        if (!atLeastOneNodeCanOutdent && $isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          if (
            $findMatchingParent(anchorNode, (node) => isIndentable(node) && node.getIndent() > 0)
          ) {
            return true
          }
          const focusNode = selection.focus.getNode()
          if (
            $findMatchingParent(focusNode, (node) => isIndentable(node) && node.getIndent() > 0)
          ) {
            return true
          }
        }
        return atLeastOneNodeCanOutdent
      },
      key: 'indentDecrease',
      label: ({ i18n }) => {
        return i18n.t('lexical:indent:decreaseLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
      },
      order: 1,
    },
    {
      ChildComponent: IndentIncreaseIcon,
      isActive: () => false,
      key: 'indentIncrease',
      label: ({ i18n }) => {
        return i18n.t('lexical:indent:increaseLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
      },
      order: 2,
    },
  ]),
]

export const IndentFeatureClient = createClientFeature({
  plugins: [
    {
      Component: TabIndentationPlugin as PluginComponent,
      position: 'normal',
    },
  ],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
