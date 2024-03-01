'use client'

import { INSERT_ORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderClient } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { OrderedListIcon } from '../../../lexical/ui/icons/OrderedList'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection'
import { createClientComponent } from '../../createClientComponent'
import { LexicalListPlugin } from '../plugin'
import { ORDERED_LIST } from './markdownTransformer'

const OrderedListFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ featureProviderMap }) => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: OrderedListIcon,
                isActive: () => false,
                key: 'orderedList',
                label: `Ordered List`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                },
                order: 10,
              },
            ]),
          ],
        },
        markdownTransformers: [ORDERED_LIST],
        nodes: featureProviderMap.has('unorderedlist') ? [] : [ListNode, ListItemNode],
        plugins: featureProviderMap.has('unorderedlist')
          ? []
          : [
              {
                Component: LexicalListPlugin,
                position: 'normal',
              },
            ],
        slashMenu: {
          options: [
            {
              displayName: 'Lists',
              key: 'lists',
              options: [
                new SlashMenuOption('orderedlist', {
                  Icon: OrderedListIcon,
                  displayName: 'Ordered List',
                  keywords: ['ordered list', 'ol'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                  },
                }),
              ],
            },
          ],
        },
      }
    },
  }
}

export const OrderedListFeatureClientComponent = createClientComponent(OrderedListFeatureClient)
