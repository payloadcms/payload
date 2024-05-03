'use client'
import { INSERT_ORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderClient } from '../../types.js'

import { OrderedListIcon } from '../../../lexical/ui/icons/OrderedList/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../../shared/inlineToolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../plugin/index.js'
import { ORDERED_LIST } from './markdownTransformer.js'

const OrderedListFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ featureProviderMap }) => {
      return {
        clientFeatureProps: props,
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
            {
              displayName: 'Lists',
              items: [
                {
                  Icon: OrderedListIcon,
                  displayName: 'Ordered List',
                  key: 'orderedList',
                  keywords: ['ordered list', 'ol'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
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
                ChildComponent: OrderedListIcon,
                isActive: () => false,
                key: 'orderedList',
                label: `Ordered List`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                },
                order: 10,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const OrderedListFeatureClientComponent = createClientComponent(OrderedListFeatureClient)
