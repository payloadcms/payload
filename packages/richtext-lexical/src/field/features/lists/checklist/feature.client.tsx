'use client'
import { $isListNode, INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { $isRangeSelection } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { ClientFeature, FeatureProviderProviderClient } from '../../types.js'

import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { toolbarTextDropdownGroupWithItems } from '../../shared/toolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../plugin/index.js'
import { CHECK_LIST } from './markdownTransformers.js'
import { LexicalCheckListPlugin } from './plugin/index.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarTextDropdownGroupWithItems([
    {
      ChildComponent: ChecklistIcon,
      isActive: ({ selection }) => {
        if (!$isRangeSelection(selection)) {
          return false
        }
        for (const node of selection.getNodes()) {
          if ($isListNode(node) && node.getListType() === 'check') {
            continue
          }

          const parent = node.getParent()

          if ($isListNode(parent) && parent.getListType() === 'check') {
            continue
          }

          const parentParent = parent?.getParent()
          // Example scenario: Node = textNode, parent = listItemNode, parentParent = listNode
          if ($isListNode(parentParent) && parentParent.getListType() === 'check') {
            continue
          }

          return false
        }
        return true
      },
      key: 'checklist',
      label: `Check List`,
      onSelect: ({ editor }) => {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      },
      order: 12,
    },
  ]),
]

const ChecklistFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ featureProviderMap }) => {
      const plugins: ClientFeature<undefined>['plugins'] = [
        {
          Component: LexicalCheckListPlugin,
          position: 'normal',
        },
      ]

      if (!featureProviderMap.has('unorderedList') && !featureProviderMap.has('orderedList')) {
        plugins.push({
          Component: LexicalListPlugin,
          position: 'normal',
        })
      }

      return {
        clientFeatureProps: props,
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedList') || featureProviderMap.has('orderedList')
            ? []
            : [ListNode, ListItemNode],
        plugins,
        slashMenu: {
          groups: [
            {
              items: [
                {
                  Icon: ChecklistIcon,
                  key: 'checklist',
                  keywords: ['check list', 'check', 'checklist', 'cl'],
                  label: 'Check List',
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
                  },
                },
              ],
              key: 'lists',
              label: 'Lists',
            },
          ],
        },
        toolbarFixed: {
          groups: toolbarGroups,
        },
        toolbarInline: {
          groups: toolbarGroups,
        },
      }
    },
  }
}

export const ChecklistFeatureClientComponent = createClientComponent(ChecklistFeatureClient)
