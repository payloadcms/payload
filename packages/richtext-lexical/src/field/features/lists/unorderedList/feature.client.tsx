'use client'

import { $isListNode, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { $isRangeSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { UnorderedListIcon } from '../../../lexical/ui/icons/UnorderedList/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../../shared/inlineToolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../plugin/index.js'
import { UNORDERED_LIST } from './markdownTransformer.js'

const UnorderedListFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
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
            {
              displayName: 'Lists',
              items: [
                {
                  Icon: UnorderedListIcon,
                  displayName: 'Unordered List',
                  key: 'unorderedList',
                  keywords: ['unordered list', 'ul'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                  },
                },
              ],
              key: 'lists',
            },
          ],
        },
        toolbarInline: {
          groups: [
            inlineToolbarTextDropdownGroupWithItems([
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
                label: `Unordered List`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                },
                order: 11,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const UnorderedListFeatureClientComponent = createClientComponent(UnorderedListFeatureClient)
