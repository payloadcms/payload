'use client'

import { $isListNode, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { $isRangeSelection } from 'lexical'

import type { ToolbarGroup } from '../../../toolbars/types.js'

import { UnorderedListIcon } from '../../../../lexical/ui/icons/UnorderedList/index.js'
import { createClientFeature } from '../../../../utilities/createClientFeature.js'
import { toolbarTextDropdownGroupWithItems } from '../../../shared/toolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../../plugin/index.js'
import { slashMenuListGroupWithItems } from '../../shared/slashMenuListGroup.js'
import { UNORDERED_LIST } from '../markdownTransformer.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarTextDropdownGroupWithItems([
    {
      ChildComponent: UnorderedListIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isListNode(node) && node.getListType() === 'bullet') {
            continue
          }

          const parent = node.getParent()

          if ($isListNode(parent) && parent.getListType() === 'bullet') {
            continue
          }

          const parentParent = parent?.getParent()
          // Example scenario: Node = textNode, parent = listItemNode, parentParent = listNode
          if ($isListNode(parentParent) && parentParent.getListType() === 'bullet') {
            continue
          }

          return false
        }
        return true
      },
      key: 'unorderedList',
      label: ({ i18n }) => {
        return i18n.t('lexical:unorderedList:label')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      },
      order: 11,
    },
  ]),
]

export const UnorderedListFeatureClient = createClientFeature({
  markdownTransformers: [UNORDERED_LIST],
  nodes: [ListNode, ListItemNode],
  plugins: [
    {
      Component: LexicalListPlugin,
      position: 'normal',
    },
  ],
  slashMenu: {
    groups: [
      slashMenuListGroupWithItems([
        {
          Icon: UnorderedListIcon,
          key: 'unorderedList',
          keywords: ['unordered list', 'ul'],
          label: ({ i18n }) => {
            return i18n.t('lexical:unorderedList:label')
          },
          onSelect: ({ editor }) => {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          },
        },
      ]),
    ],
  },
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
