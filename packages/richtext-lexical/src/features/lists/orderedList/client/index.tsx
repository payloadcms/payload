'use client'
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { $isRangeSelection } from 'lexical'

import type { ToolbarGroup } from '../../../toolbars/types.js'

import { OrderedListIcon } from '../../../../lexical/ui/icons/OrderedList/index.js'
import { createClientFeature } from '../../../../utilities/createClientFeature.js'
import { toolbarTextDropdownGroupWithItems } from '../../../shared/toolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../../plugin/index.js'
import { slashMenuListGroupWithItems } from '../../shared/slashMenuListGroup.js'
import { ORDERED_LIST } from '../markdownTransformer.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarTextDropdownGroupWithItems([
    {
      ChildComponent: OrderedListIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isListNode(node) && node.getListType() === 'number') {
            continue
          }

          const parent = node.getParent()

          if ($isListNode(parent) && parent.getListType() === 'number') {
            continue
          }

          const parentParent = parent?.getParent()
          // Example scenario: Node = textNode, parent = listItemNode, parentParent = listNode
          if ($isListNode(parentParent) && parentParent.getListType() === 'number') {
            continue
          }

          return false
        }
        return true
      },
      key: 'orderedList',
      label: ({ i18n }) => {
        return i18n.t('lexical:orderedList:label')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      },
      order: 10,
    },
  ]),
]

export const OrderedListFeatureClient = createClientFeature(({ featureProviderMap }) => {
  return {
    markdownTransformers: [ORDERED_LIST],
    nodes: featureProviderMap.has('orderedList') ? [] : [ListNode, ListItemNode],
    plugins: featureProviderMap.has('orderedList')
      ? []
      : [
          {
            Component: LexicalListPlugin,
            position: 'normal',
          },
        ],
    slashMenu: {
      groups: [
        slashMenuListGroupWithItems([
          {
            Icon: OrderedListIcon,
            key: 'orderedList',
            keywords: ['ordered list', 'ol'],
            label: ({ i18n }) => {
              return i18n.t('lexical:orderedList:label')
            },
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
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
  }
})
